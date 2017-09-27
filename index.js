/* global __dirname, require, process */
"use strict";
let winston = require("winston");
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {colorize: true});

// Sometimes things go awry.
process.on("uncaughtException", function(err) {
    winston.emergency("uncaughtException:", err.message);
    winston.emergency(err.stack);
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
    winston.info("Express server listening on port " + app.get("port"));
});

let rtsWsApi = require("./app/ws-api")(primus, winston);

app.use("/api", require("./app/rest-api")(winston, rtsWsApi));

let Gpio = require("pigpio").Gpio;
let button = Gpio(4, {
    mode: Gpio.INPUT,
    pullUpDown: Gpio.PUD_DOWN,
    edge: Gpio.EITHER_EDGE
});
button.on("interrupt", function(level) {
    winston.info("IR sensed: " + level.toString());
});