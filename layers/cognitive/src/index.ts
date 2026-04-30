// ==============================================================================
// Exnoria · Cognitive layer · Entry point
// Initializes DB, MCP clients, channels, and the event loop — runs persistently
// ==============================================================================
import { Pool }           from 'pg';
import { initTelegram }   from './channels/telegram';
import { createEventLoop } from './events/loop';
import { initMcpClients, shutdownMcpClients } from './mcp/client';
import * as memoryServer from './memory/server';
import { createLogger }   from '../../shared/logging';

const db = new Pool({
  connectionString: process.env.POSTGRES_URL,
  max: 5
});

const logger = createLogger('index', 'cognitive');

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
  await initMcpClients();
  logger.info('MCP clients ready');

  // Start memory search HTTP endpoint (if enabled)
  const memoryPort = parseInt(process.env.COGNITIVE_MEMORY_PORT ?? '0', 10);
  if (memoryPort > 0) {
    memoryServer.startServer(db);
  }

  // Create event loop
  const { processEvent } = createEventLoop(db);

  // Initialize Telegram channel
  initTelegram(processEvent);

  logger.info('Event loop running — waiting for signals');
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received — shutting down');
  await shutdownMcpClients();
  await db.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received — shutting down');
  await shutdownMcpClients();
  await db.end();
  process.exit(0);
});

main().catch((err) => {
  logger.error({ error: err }, 'Fatal error during startup');
  process.exit(1);
});
