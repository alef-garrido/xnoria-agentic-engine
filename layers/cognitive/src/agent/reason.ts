// ==============================================================================
// Exnoria · Cognitive · Agent reasoning wrapper (Phase 4 B4)
// Routes to coordinator → specialist → filter OR single agent
// ==============================================================================
import { Pool } from 'pg';
import { CXEvent } from '../shared/types';
import { coordinate } from './coordinator';
import { runSingleAgent } from './single';

export async function reason(db: Pool, event: CXEvent): Promise<void> {
  const mode = process.env.AGENT_MODE ?? 'single';

  if (mode === 'single') {
    return runSingleAgent(db, event);
  }

  return coordinate(db, event);
}
