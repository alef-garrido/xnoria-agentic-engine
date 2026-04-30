"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEventLoop = createEventLoop;
const coordinator_1 = require("../agent/coordinator");
function createEventLoop(db) {
    // Process a single inbound event through the reasoning cycle
    async function processEvent(event) {
        console.log('[loop] Processing event:', JSON.stringify(event));
        try {
            await (0, coordinator_1.coordinate)(db, event);
            console.log(`[loop] Event routed: stage=${event.stage} contact=${event.contact_id}`);
        }
        catch (err) {
            console.error('[loop] Error in routing:', err);
        }
    }
    return { processEvent };
}
