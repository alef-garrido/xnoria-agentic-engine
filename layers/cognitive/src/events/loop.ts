// ==============================================================================
// Exnoria · Cognitive · Event loop (Phase 4 B4)
// Receives CXEvents and routes to coordinator → specialist
// Specialists dispatch to filter and write memory directly
// ==============================================================================
import { Pool }         from 'pg';
import { coordinate }   from '../agent/coordinator';
import { CXEvent }      from '../shared/types';

export function createEventLoop(db: Pool) {
  // Process a single inbound event through the reasoning cycle
  async function processEvent(event: CXEvent): Promise<void> {
    try {
      await coordinate(db, event);
      console.log(`[loop] Event routed: stage=${event.stage} contact=${event.contact_id}`);
    } catch (err) {
      console.error('[loop] Error in routing:', err);
    }
  }

  return { processEvent };
}
