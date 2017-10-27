/* eslint no-console: "off" */
define(["plugins/http", "plugins/observable", "durandal/app", "primus"],
function(http, observable, app, primus) {
    const HIT_VALUE = 314;
    const GAME_TIME = 60000;
    var ctor = function() {
        this.startScreen = true;
        this.isConnected = false;
        this.messages = [];
        this.primus = null;
        this.points = 0;

        this.createPrimus = function(url) {
            return new Primus(url);
        };
        this.attached = function (view) {
            var self = this;
            $(document).keypress(function() {
                if(self.startScreen === true) {
                    self.points = 0;
                    self.startScreen = false;
                    setTimeout(function() {
                        //Display score then...
                        self.startScreen = true;
                    }, GAME_TIME);
                }
            });
        }

        this.activate = function() {
            // the router's activator calls this function and waits for it to complete before proceeding
            if(this.primus === null || this.primus.online !== true) {
                this.primus = this.createPrimus(location.href.replace(location.hash, ""));

                this.primus.on("open", function() {
                    console.log("Connection established.");
                    this.isConnected = true;
                }.bind(this));
                this.primus.on("reconnect timeout", function(err, opts) {
                    console.log("Timeout expired: %s", err.message);
                });
                this.primus.on("reconnect", function(err, opts) {
                    console.log("Reconnecting.", err.message);
                    this.isConnected = false;
                }.bind(this));
                this.primus.on("reconnected", function(err, opts) {
                    console.log("Reconnected.", err.message);
                    this.isConnected = true;
                }.bind(this));
                this.primus.on("end", function() {
                    console.log("Connection ended.");
                    this.isConnected = false;
                }.bind(this));
                this.primus.on("data", function(data) {
                    console.log(data);
                    if (this.messages !== undefined) {
                        this.messages.push({message: "Message received: " + data.messageType});
                    }
                    if (data.messageType) {
                        switch (data.messageType) {
                        case "hit":
                            if(this.startScreen === false) {
                                this.points += HIT_VALUE;
                            }
                        }
                    } else {
                        console.log(JSON.stringify(data));
                    }
                }.bind(this));
            }
        };
        this.deactivate = function() {
            if(this.primus) {
                this.primus.end();
            }
        };
    };

    return ctor;
});
