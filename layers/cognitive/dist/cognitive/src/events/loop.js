"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEventLoop = createEventLoop;
const reason_1 = require("../agent/reason");
const logging_1 = require("../../../shared/logging");
function createEventLoop(db) {
    const logger = (0, logging_1.createLogger)('events-loop', 'cognitive');
    // Process a single inbound event through the reasoning cycle
    async function processEvent(event) {
        logger.debug({ event }, 'Processing event');
        try {
            await (0, reason_1.reason)(db, event);
            logger.info({ contact_id: event.contact_id, stage: event.stage }, 'Event routed');
        }
        catch (err) {
            logger.error({ error: err, contact_id: event.contact_id }, 'Error in routing');
        }
    }
    return { processEvent };
}
