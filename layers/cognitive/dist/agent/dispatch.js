"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dispatchToFilter = dispatchToFilter;
// ==============================================================================
// Exnoria · Cognitive · Filter Dispatch Helper
// Phase 4 B4 — Shared dispatch logic for specialists
//
// Provides dispatchToFilter function for specialist agents to send actions
// to the filter service.
// ==============================================================================
const axios_1 = __importDefault(require("axios"));
const FILTER_URL = process.env.FILTER_URL ?? 'http://filter:3000';
/**
 * Dispatch an action to the filter service
 */
async function dispatchToFilter(action) {
    const res = await axios_1.default.post(`${FILTER_URL}/filter/execute`, {
        action_id: action.action_id,
        stage: action.stage,
        session_id: action.session_id,
        contact_id: action.contact_id,
        signal_id: action.signal_id,
        signal_severity: action.signal_severity,
        cause_code: action.cause_code,
        interventions: action.interventions,
        payload: action.payload,
        meta: {
            triggered_by: action.meta?.triggered_by || 'specialist',
            cluster: action.meta?.cluster,
            ...action.meta,
        },
    });
    return res.data;
}
