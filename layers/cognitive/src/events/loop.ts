// ==============================================================================
// Exnoria · Cognitive · Event loop (Phase 4 B4)
// Receives CXEvents and routes to coordinator → specialist
// Specialists dispatch to filter and write memory directly
// ==============================================================================
import { Pool }         from 'pg';
import { reason }       from '../agent/reason';
import { CXEvent }      from '../shared/types';
import { createLogger } from '../../../shared/logging';

export function createEventLoop(db: Pool) {
  const logger = createLogger('events-loop', 'cognitive');
  
  // Process a single inbound event through the reasoning cycle
  async function processEvent(event: CXEvent): Promise<void> {
    logger.debug({ event }, 'Processing event');
    try {
      await reason(db, event);
      logger.info({ contact_id: event.contact_id, stage: event.stage }, 'Event routed');
    } catch (err) {
      logger.error({ error: err, contact_id: event.contact_id }, 'Error in routing');
    }
  }

  return { processEvent };
}
