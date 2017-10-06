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
    targets: config.get("shoot.targets"),
    hit: function(target, level) {
        target.level = level;
        if(level === 0) {
            wsApi.hit(t.name);
        }
    }
};

servos.listPorts().then(function() {
    servos.init().then(function() {
        targetManager.targets.forEach(function(t) {
            t.trigger = Gpio(t.pin, {
                mode: Gpio.INPUT,
                pullUpDown: Gpio.PUD_DOWN,
                edge: Gpio.EITHER_EDGE
            });
            t.trigger.on("interrupt", function(level) {
                logger.info("Hit on target: " + t.name);
                hit(t, level);
            });
            servos.write(t.channel, 24000).then(function() {
                servos.close();
            });
        });
        /*servos.write(0x2, 4000).then(function() {
            setTimeout(function() {
                servos.write(0x2, 8000).then(function() {

                }, function(err) {
                    logger.error(err);
                });
            }, 500);
        }, function(err){
            logger.error(err);
        });*/
    });
});

