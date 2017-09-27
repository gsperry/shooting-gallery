/* global module,require*/
let logger = null;
let wsApi = null;

// eslint-disable-next-line new-cap
let router = require("express").Router();

// Setup REST handlers
router.get("/", function(req, res) {
    logger.info("get.");
    res.status(204).end();
});


module.exports = function(log, ws) {
    logger = log;
    wsApi = ws;

    return router;
};
