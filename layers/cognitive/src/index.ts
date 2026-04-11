// ==============================================================================
// Exnoria · Cognitive layer · Entry point
// Initializes DB, MCP clients, channels, and the event loop — runs persistently
// ==============================================================================
import { Pool }           from 'pg';
import { initTelegram }   from './channels/telegram';
import { createEventLoop } from './events/loop';
import { initMcpClients, shutdownMcpClients } from './mcp/client';
import * as memoryServer from './memory/server';

const db = new Pool({
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
  await initMcpClients();
  console.log('[cognitive] MCP clients ready');

  // Start memory search HTTP endpoint (if enabled)
  const memoryPort = parseInt(process.env.COGNITIVE_MEMORY_PORT ?? '0', 10);
  if (memoryPort > 0) {
    memoryServer.startServer(db);
  }

  // Create event loop
  const { processEvent } = createEventLoop(db);

  // Initialize Telegram channel
  initTelegram(processEvent);

  console.log('[cognitive] Event loop running — waiting for signals');
  console.log('================================================================\n');
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[cognitive] SIGTERM received — shutting down');
  await shutdownMcpClients();
  await db.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[cognitive] SIGINT received — shutting down');
  await shutdownMcpClients();
  await db.end();
  process.exit(0);
});

main().catch((err) => {
  console.error('[cognitive] Fatal error:', err);
  process.exit(1);
});
