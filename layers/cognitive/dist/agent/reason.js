"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reason = reason;
const coordinator_1 = require("./coordinator");
async function reason(db, event) {
    return (0, coordinator_1.coordinate)(db, event);
}
