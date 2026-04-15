// ==============================================================================
// Exnoria · Cognitive · Coordinator Agent
// Phase 4 B4 — Multi-agent orchestration
//
// Receives CXEvents, validates stage, routes to correct specialist, returns result.
// The coordinator NEVER dispatches to the filter — only specialists do.
// ==============================================================================
import { Pool } from 'pg';
import { v4 as uuid } from 'uuid';
import { CXEvent } from '../shared/types';
import { STAGE_TO_CLUSTER } from '../tools/clusters';
import { getContactHistory } from '../memory/engram';
import { runAcqSalSpecialist } from './specialists/acqsal';
import { runLifecycleSpecialist } from './specialists/lifecycle';
import { runEscalationSpecialist } from './specialists/escalation';
import { sendReply } from '../channels/telegram';
import { logSessionToDb } from '../memory/session';

export type AgentCluster = 'acqsal' | 'lifecycle' | 'escalation';

const CLUSTER_RUNNERS: Record<AgentCluster, (db: Pool, event: CXEvent) => Promise<void>> = {
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
export async function coordinate(db: Pool, event: CXEvent): Promise<void> {
  // 1. Generate a session_id for this reasoning cycle
  const session_id = uuid();

  // 2. Validate stage and determine cluster
  const cluster = event.stage ? STAGE_TO_CLUSTER[event.stage] : undefined;

  if (!cluster) {
    // Unrecognised or missing stage — reply gracefully so the user knows what to send
    const hint = event.stage
      ? `Stage "${event.stage}" is not recognised.`
      : 'No journey stage detected in your message.';
    const replyText = `${hint} Please include a stage keyword: ACQ, SAL, ONB, PRD, SUP, COM, RET or EXP.`;
    console.warn(`[coordinator] ${hint} contact=${event.contact_id}`);
    await sendReply(event.contact_id, replyText);
    // Log this conversation turn to Postgres so the dashboard reflects it
    await logSessionToDb(db, session_id, event, 'coordinator', [], replyText);
    return;
  }

  console.log(`[coordinator] stage=${event.stage} cluster=${cluster} contact=${event.contact_id}`);

  // 3. Fetch cross-stage history (gives specialist context about other stages)
  const crossStageHistory = await buildCrossStageHistory(db, event.contact_id);

  // 4. Attach routing metadata to event (including session_id so specialists reuse it)
  event.meta = {
    ...event.meta,
    cross_stage_history: crossStageHistory,
    routed_by: 'coordinator',
    cluster,
    session_id,       // Specialists read this to avoid creating a duplicate session row
  };

  // 5. Route to specialist
  await CLUSTER_RUNNERS[cluster](db, event);
}
