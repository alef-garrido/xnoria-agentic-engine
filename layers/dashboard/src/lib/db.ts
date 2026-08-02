import { Pool } from 'pg';
import { logger } from '@/lib/logger';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

export async function query(text: string, params?: unknown[]) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  // Minimal logging in dev, suppress in prod
  if (process.env.NODE_ENV !== 'production') {
    logger.debug({ query: { text, duration, rows: res.rowCount } }, 'Executed query');
  }
  return res;
}
