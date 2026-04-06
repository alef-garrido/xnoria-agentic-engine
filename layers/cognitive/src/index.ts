// ==============================================================================
// Exnoria · Cognitive layer · Entry point
// Initializes DB, channels, and the event loop — runs persistently
// ==============================================================================
import { Pool }           from 'pg';
import { initTelegram }   from './channels/telegram';
import { createEventLoop } from './events/loop';

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

  // Create event loop
  const { processEvent } = createEventLoop(db);

  // Initialize Telegram channel
  initTelegram(processEvent);

  console.log('[cognitive] Event loop running — waiting for signals');
  console.log('================================================================\n');
}

main().catch((err) => {
  console.error('[cognitive] Fatal error:', err);
  process.exit(1);
});
