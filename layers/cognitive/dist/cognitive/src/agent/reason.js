"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reason = reason;
const coordinator_1 = require("./coordinator");
const single_1 = require("./single");
async function reason(db, event) {
    const mode = process.env.AGENT_MODE ?? 'single';
    if (mode === 'single') {
        return (0, single_1.runSingleAgent)(db, event);
    }
    return (0, coordinator_1.coordinate)(db, event);
}
