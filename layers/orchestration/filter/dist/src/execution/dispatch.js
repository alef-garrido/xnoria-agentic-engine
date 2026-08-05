"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dispatchToN8n = dispatchToN8n;
const axios_1 = __importDefault(require("axios"));
const N8N_BASE_URL = process.env.N8N_BASE_URL ?? 'http://n8n:5678';
async function dispatchToN8n(workflowId, payload) {
    const url = `${N8N_BASE_URL}/webhook/${workflowId}`;
    try {
        const response = await axios_1.default.post(url, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
        });
        return response.data;
    }
    catch (err) {
        if (axios_1.default.isAxiosError(err)) {
            throw new Error(`WORKFLOW_UNREACHABLE: ${err.message}`);
        }
        throw err;
    }
}
