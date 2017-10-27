/* global __dirname, require, process */
"use strict";
const INTERVAL = 1500;

let logger = require("winston");
let config = require("config");
logger.setLevels(config.get("shoot.log.levels"));
logger.addColors(config.get("shoot.log.colors"));
logger.level = config.get("shoot.log.level");
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {colorize: true});

// Sometimes things go awry.
process.on("uncaughtException", function(err) {
    logger.emergency("uncaughtException:", err.message);
    logger.emergency(err.stack);
    process.exit(1);
});

let express = require("express");
let favicon = require("serve-favicon");
let bodyParser = require("body-parser");
let errorHandler = require("errorhandler");
let http = require("http");
let path = require("path");

let app = express();
let Primus = require("primus");

app.set("port", process.env.PORT || 3000);
app.use(favicon(__dirname + "/client/favicon.png"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, "client")));

let server = http.createServer(app);
let transformer = "websockets";
let primus = new Primus(server, {transformer: transformer});
primus.library();
primus.save(__dirname +'/client/lib/primus/primus.js');
server.listen(app.get("port"), function() {
    logger.info("Express server listening on port " + app.get("port"));
});

let wsApi = require("./app/ws-api")(primus, logger);

app.use("/api", require("./app/rest-api")(logger, wsApi));

if(config.get("shoot.useHardware") === true) {
    let servos = require("./app/servo-api.js")(logger);
    let Gpio = require("pigpio").Gpio;
    let targetManager = {
        targets: config.get("shoot.targets")
    };
    
    servos.listPorts().then(function() {
        servos.init().then(function() {
            let setupServos = [];
            targetManager.targets.forEach(function(t) {
                let target = t;
                target.active = false;
                setupServos.push(servos.write(target.channel, target.down));
                target.trigger = Gpio(target.pin, {
                    mode: Gpio.INPUT,
                    pullUpDown: (target.updown === "down") ? Gpio.PUD_DOWN : Gpio.PUD_UP,
                    edge: Gpio.EITHER_EDGE
                });
                target.trigger.on("interrupt", function(level) {
                    logger.info("Hit on target: " + target.name);
                    if(target.active === true && level === 0) {
                        servos.write(target.channel, target.down).then(function() {
                            wsApi.hit(target.name).then(function() {
                                target.active = false;
                            });
                        });
                    }
                });
            });
            Promise.all(setupServos).then(setTimeout(activateTarget, INTERVAL));
        });
    });
    
    function activateTarget() {
        let target = targetManager.targets[Math.floor(Math.random() * targetManager.targets.length)];
        if(target.active === false) {
            servos.write(target.channel, target.up).then(function() {
                target.active = true;
                setTimeout(activateTarget, INTERVAL);
            });
        } else {
            setTimeout(activateTarget, INTERVAL);
        }
    }
}

function test() {
    wsApi.hit("groot").then(function() {
        setTimeout(function() {
            test();
        }, 1000);
    });
}

test();
