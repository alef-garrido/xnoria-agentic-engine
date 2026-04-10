"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEventLoop = createEventLoop;
const reason_1 = require("../agent/reason");
const telegram_1 = require("../channels/telegram");
function createEventLoop(db) {
    // Process a single inbound event through the reasoning cycle
    async function processEvent(event) {
        try {
            const result = await (0, reason_1.reason)(db, event);
            // Route reply back through the originating channel
            if (result.reply) {
                switch (event.channel) {
                    case 'telegram':
                        await (0, telegram_1.sendReply)(event.contact_id, result.reply);
                        break;
                    case 'n8n':
                    case 'internal':
                        console.log(`[loop] Reply (${event.channel}): ${result.reply}`);
                        break;
                }
            }
            console.log(`[loop] Session ${result.session_id} complete — ` +
                `${result.actions_taken.length} action(s) dispatched`);
        }
        catch (err) {
            console.error('[loop] Error in reasoning cycle:', err);
        }
    }
    return { processEvent };
}
