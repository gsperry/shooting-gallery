/* global module,require*/
/* eslint prefer-spread: "off" */
let logger = null;
let sparks = [];

/**
 * Function to attach to Primus events
 * @param {Primus} primus - The primus instance used for this app.
 */
function setupPrimus(primus) {
    primus.on("connection", function(spark) {
        sparks.push(spark);
        logger.info("New connection.", {
            identity: spark.id
        });
        spark.on("data", function(message) {
            logger.info("Message received %s.", message);
        });
        spark.on("heartbeat", function() {
            logger.trace("Hearbeat.");
        });
    });

    primus.on("disconnection", function(spark) {
        sparks = sparks.filter(function(s) {
            return s.id !== spark.id;
        });
    });
}

/**
 * Send data message to all connected sparks
 * @param {Message} data - object to send to sparks.
 */
function notify(data) {
    let sparks = [];
    sparks.forEach(function(spark) {
        spark.write(data);
    });
}

/**
 *
 * @param {Spark} spark - newly connected gallery spark.
 */
function initializeGallery(spark) {
    logger.debug("Initializing gallery.");
    spark.write({});
}


module.exports = function(primus, log) {
    logger = log;

    setupPrimus(primus);

    return {
        version: "1.0",
    };
};
