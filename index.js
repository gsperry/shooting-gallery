/* global __dirname, require, process */
"use strict";
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

server.listen(app.get("port"), function() {
    logger.info("Express server listening on port " + app.get("port"));
});

let wsApi = require("./app/ws-api")(primus, logger);

app.use("/api", require("./app/rest-api")(logger, wsApi));

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
            setupServos.push(servos.write(target.channel, 9000));
            target.trigger = Gpio(target.pin, {
                mode: Gpio.INPUT,
                pullUpDown: Gpio.PUD_DOWN,
                edge: Gpio.EITHER_EDGE
            });
            target.trigger.on("interrupt", function(level) {
                logger.info("Hit on target: " + target.name);
                if(target.active === true && level === 0) {
                    servos.write(target.channel, 9000)
                    wsApi.hit(target.name);
                }
            });
        });
        Promise.all(setupServos).then(setTimeout(activateTarget, 3000));
    });
});

function activateTarget() {
    let target = targetManager.targets[Math.floor(Math.random() * targetManager.targets.length)];
    if(target.active === false) {
        servos.write(target.channel, 800).then(function() {
            target.active = true;
            setTimeout(activateTarget, 3000);
        });
    } else {
        setTimeout(activateTarget, 3000);
    }
}


