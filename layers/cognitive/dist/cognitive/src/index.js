"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// ==============================================================================
// Exnoria · Cognitive layer · Entry point
// Initializes DB, MCP clients, channels, and the event loop — runs persistently
// ==============================================================================
const pg_1 = require("pg");
const telegram_1 = require("./channels/telegram");
const loop_1 = require("./events/loop");
const client_1 = require("./mcp/client");
const memoryServer = __importStar(require("./memory/server"));
const logging_1 = require("../../shared/logging");
const db = new pg_1.Pool({
    connectionString: process.env.POSTGRES_URL,
    max: 5
});
const logger = (0, logging_1.createLogger)('index', 'cognitive');
async function main() {
    logger.info({
        model: process.env.LLM_MODEL ?? 'qwen/qwen3-32b',
        baseURL: process.env.LLM_BASE_URL,
        filter: process.env.FILTER_URL,
        channel: 'Telegram'
    }, 'Exnoria · Cognitive layer (OpenClaw) starting');
    // Connect to Postgres
    await db.connect();
    logger.info('Connected to Postgres');
    // Initialize MCP clients (Compass, Engram, PostHog)
    logger.info('Initializing MCP clients...');
    await (0, client_1.initMcpClients)();
    logger.info('MCP clients ready');
    // Start memory search HTTP endpoint (if enabled)
    const memoryPort = parseInt(process.env.COGNITIVE_MEMORY_PORT ?? '0', 10);
    if (memoryPort > 0) {
        memoryServer.startServer(db);
    }
    // Create event loop
    const { processEvent } = (0, loop_1.createEventLoop)(db);
    // Initialize Telegram channel
    (0, telegram_1.initTelegram)(processEvent);
    logger.info('Event loop running — waiting for signals');
}
// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received — shutting down');
    await (0, client_1.shutdownMcpClients)();
    await db.end();
    process.exit(0);
});
process.on('SIGINT', async () => {
    logger.info('SIGINT received — shutting down');
    await (0, client_1.shutdownMcpClients)();
    await db.end();
    process.exit(0);
});
main().catch((err) => {
    logger.error({ error: err }, 'Fatal error during startup');
    process.exit(1);
});
