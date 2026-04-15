// ==============================================================================
// Exnoria · Cognitive · Coordinator Agent
// Phase 4 B4 — Multi-agent orchestration
//
// Receives CXEvents, validates stage, routes to correct specialist, returns result.
// The coordinator NEVER dispatches to the filter — only specialists do.
// ==============================================================================
import { Pool } from 'pg';
import { CNXEvent } from '../shared/types';
import { STAGE_TO_CLUSTER, getClusterStages } from '../tools/clusters';
import { getContactHistory } from '../memory/engram';
import { runAcqSalSpecialist } from './specialists/acqsal';
import { runLifecycleSpecialist } from './specialists/lifecycle';
import { runEscalationSpecialist } from './specialists/escalation';

export type AgentCluster = 'acqsal' | 'lifecycle' | 'escalation';

const CLUSTER_RUNNERS: Record<AgentCluster, (db: Pool, event: CNXEvent) => Promise<void>> = {
  acqsal: runAcqSalSpecialist,
  lifecycle: runLifecycleSpecialist,
  escalation: runEscalationSpecialist,
};

/**
 * Build cross-stage history for a contact
 * Fetches all stages for this contact (not just the current stage)
 */
async function buildCrossStageHistory(db: Pool, contactId: string): Promise<string> {
  try {
    // Fetch history from all stages
    return await getContactHistory(contactId, 'ALL', 'general', 5);
  } catch (err) {
    console.warn('[coordinator] Cross-stage history fetch failed:', err);
    return '';
  }
}

/**
 * Route a CXEvent to the correct specialist based on stage
 * 
 * This is the ONLY entry point from the reason() wrapper.
 * The coordinator never calls dispatchToFilter — only specialists do.
 */
export async function coordinate(db: Pool, event: CNXEvent): Promise<void> {
  // 1. Validate stage and determine cluster
  const cluster = STAGE_TO_CLUSTER[event.stage!];
  
  if (!cluster) {
    throw new Error(`[coordinator] Unknown stage: ${event.stage}`);
  }

  console.log(`[coordinator] stage=${event.stage} cluster=${cluster} contact=${event.contact_id}`);

  // 2. Fetch cross-stage history (gives specialist context about other stages)
  const crossStageHistory = await buildCrossStageHistory(db, event.contact_id);

  // 3. Attach routing metadata to event
  event.meta = {
    ...event.meta,
    cross_stage_history: crossStageHistory,
    routed_by: 'coordinator',
    cluster,
  };

  // 4. Route to specialist
  await CLUSTER_RUNNERS[cluster](db, event);
}
