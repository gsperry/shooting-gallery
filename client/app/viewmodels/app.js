/* eslint no-console: "off" */
define(["plugins/http", "plugins/observable", "durandal/app"],
function(http, observable, app) {
    var ctor = function() {
        this.displayName = "App";
        this.isConnected = false;
        this.messages = [];
        this.primus = null;

        this.activate = function() {
            // the router's activator calls this function and waits for it to complete before proceeding
            if(this.primus === null || this.primus.online !== true) {
                event.setupPrimus(this);
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
