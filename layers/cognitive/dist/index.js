"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ==============================================================================
// Exnoria · Cognitive layer · Entry point
// Initializes DB, MCP clients, channels, and the event loop — runs persistently
// ==============================================================================
const pg_1 = require("pg");
const telegram_1 = require("./channels/telegram");
const loop_1 = require("./events/loop");
const client_1 = require("./mcp/client");
const db = new pg_1.Pool({
    connectionString: process.env.POSTGRES_URL,
    max: 5
});
async function main() {
    console.log('================================================================');
    console.log(' Exnoria · Cognitive layer (OpenClaw)');
    console.log('================================================================');
    console.log(` LLM:     ${process.env.LLM_MODEL ?? 'qwen/qwen3-32b'} @ ${process.env.LLM_BASE_URL}`);
    console.log(` Filter:  ${process.env.FILTER_URL}`);
    console.log(` Channel: Telegram`);
    console.log('----------------------------------------------------------------');
    // Connect to Postgres
    await db.connect();
    console.log('[cognitive] Connected to Postgres');
    // Initialize MCP clients (Compass, MemPalace, PostHog)
    console.log('[cognitive] Initializing MCP clients...');
    await (0, client_1.initMcpClients)();
    console.log('[cognitive] MCP clients ready');
    // Create event loop
    const { processEvent } = (0, loop_1.createEventLoop)(db);
    // Initialize Telegram channel
    (0, telegram_1.initTelegram)(processEvent);
    console.log('[cognitive] Event loop running — waiting for signals');
    console.log('================================================================\n');
}
// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('[cognitive] SIGTERM received — shutting down');
    await (0, client_1.shutdownMcpClients)();
    await db.end();
    process.exit(0);
});
process.on('SIGINT', async () => {
    console.log('[cognitive] SIGINT received — shutting down');
    await (0, client_1.shutdownMcpClients)();
    await db.end();
    process.exit(0);
});
main().catch((err) => {
    console.error('[cognitive] Fatal error:', err);
    process.exit(1);
});
