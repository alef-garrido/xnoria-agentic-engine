// ==============================================================================
// Exnoria · Cognitive layer · Memory search HTTP endpoint
// Minimal Express server for dashboard API proxy
// ==============================================================================
import express, { Request, Response } from 'express';
import { Pool } from 'pg';
import { exec } from 'child_process';

const app  = express();
const port = parseInt(process.env.COGNITIVE_MEMORY_PORT ?? '0', 10);

app.use(express.json());

// DB connection pool (shared with main)
const db = new Pool({
  connectionString: process.env.POSTGRES_URL,
  max: 5
});

// Memory search endpoint
app.get('/memory/search', (req: Request, res: Response) => {
  const { contact_id, stage } = req.query;

  if (!contact_id) {
    return res.status(400).json({
      error: 'MISSING_CONTACT_ID',
      message: 'Missing required parameter: contact_id'
    });
  }

  // Call engram CLI directly - search all projects, not just xnoria-project-specific
  const searchQuery = stage ? `${contact_id} | ${stage}` : contact_id;
  const engramSearch = `engram search "${searchQuery}"`;

  exec(engramSearch, { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
    if (error) {
      console.error('[memory/search] Engram CLI error:', error);
      return res.status(500).json({
        error: 'MEMORY_UNAVAILABLE',
        message: `Memory search failed: ${error.message}`
      });
    }

    // Parse engram CLI output
    // Output format: "Found X memories:" followed by entries
    // Extract memory entries from stdout
    const memories = parseEngramOutput(stdout);

    res.json({ memories });
  });
});

// Parse Engram CLI output into structured memory objects
function parseEngramOutput(output: string): Array<{ title: string; content: string; created_at: string }> {
  const memories: Array<{ title: string; content: string; created_at: string }> = [];
  const lines = output.split('\n');

  for (const line of lines) {
    // Match format: "[1] #1 (manual) — TEST_CID_001 | ONB | ONB_FRC_01 → onb.contact.nudge [executed]"
    const match = line.match(/\[\d+\] #\d+.*— (.+)$/);
    if (match) {
      memories.push({
        title: match[1],
        content: '',
        created_at: new Date().toISOString()
      });
    }
  }

  return memories;
}

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'exnoria-cognitive-memory' });
});

// Export start function for integration with main server
export function startServer(db: Pool) {
  if (port <= 0) {
    console.log('[cognitive] Memory search endpoint disabled (COGNITIVE_MEMORY_PORT not set)');
    return;
  }

  console.log('================================================================');
  console.log(' Exnoria · Cognitive layer (Memory Search Endpoint)');
  console.log('================================================================');
  console.log(` Port: ${port}`);
  console.log('----------------------------------------------------------------');

  // Connect to Postgres
  db.connect().then(() => {
    console.log('[cognitive] Connected to Postgres');

    // Start HTTP server
    app.listen(port, () => {
      console.log(`[cognitive] Memory search endpoint running on port ${port}`);
      console.log('================================================================\n');
    });
  }).catch((err) => {
    console.error('[cognitive] Failed to initialize memory server:', err);
    process.exit(1);
  });

  // Graceful shutdown
  const cleanup = async () => {
    console.log('[cognitive] Shutting down memory server...');
    await db.end();
    process.exit(0);
  };

  process.on('SIGTERM', cleanup);
  process.on('SIGINT', cleanup);
}