// ==============================================================================
// Exnoria · Cognitive · Agent reasoning wrapper (Phase 4 B4)
// Routes to coordinator → specialist → filter
// ==============================================================================
import { Pool } from 'pg';
import { CXEvent } from '../shared/types';
import { coordinate } from './coordinator';

export async function reason(db: Pool, event: CXEvent): Promise<void> {
  return coordinate(db, event);
}
