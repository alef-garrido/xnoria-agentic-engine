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
import { createLogger } from '../../../shared/logging';
import { t } from '../i18n/strings';

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
async function buildCrossStageHistory(db: Pool, contactId: string, logger: ReturnType<typeof createLogger>): Promise<string> {
  try {
    return await getContactHistory(contactId, 'ALL', 'general', 5);
  } catch (err) {
    logger.warn({ err }, 'Cross-stage history fetch failed');
    return '';
  }
}

// Lightweight keyword map for intent inference when stage is not detected by the Telegram adapter.
// This is a stopgap — proper intent extraction belongs in the channel adapter.
// Maps keyword patterns to (cluster, defaultStage) pairs.
const INTENT_FALLBACK: Array<{ pattern: RegExp; cluster: AgentCluster; defaultStage: CXEvent['stage'] }> = [
  { pattern: /\b(?:prioritize|prioridad|lead|entrante|inbound|enroll|enrolar|prospect|outreach)\b/i, cluster: 'acqsal',     defaultStage: 'SAL' },
  { pattern: /\b(?:onboard|bienvenida|churn|cancelar|winback|retener|contenido|publicar|friccion|adoption)\b/i, cluster: 'lifecycle',  defaultStage: 'ONB' },
  { pattern: /\b(?:ticket|escalate|escalar|soporte|support|bug|incidencia|expansion|upsell)\b/i, cluster: 'escalation', defaultStage: 'SUP' },
];

function inferClusterFromText(text: string): { cluster: AgentCluster; defaultStage: CXEvent['stage'] } | undefined {
  for (const entry of INTENT_FALLBACK) {
    if (entry.pattern.test(text)) {
      return { cluster: entry.cluster, defaultStage: entry.defaultStage };
    }
  }
  return undefined;
}

/**
 * Route a CXEvent to the correct specialist based on stage
 *
 * This is the ONLY entry point from the reason() wrapper.
 * The coordinator never calls dispatchToFilter — only specialists do.
 */
export async function coordinate(db: Pool, event: CXEvent): Promise<void> {
  const logger = createLogger('agent-coordinator', 'cognitive');

  // 1. Generate a session_id for this reasoning cycle
  const session_id = uuid();

  // 2. Validate stage and determine cluster
  let cluster = event.stage ? STAGE_TO_CLUSTER[event.stage] : undefined;

  if (!cluster) {
    // Attempt lightweight intent inference from the raw operator message before hard-failing
    const inferred = event.input ? inferClusterFromText(event.input) : undefined;

    if (inferred) {
      logger.warn(
        { contact_id: event.contact_id, cluster: inferred.cluster, stage: inferred.defaultStage },
        'Stage not detected — inferred cluster from message text',
      );
      cluster = inferred.cluster;
      event.stage = inferred.defaultStage;
    } else {
      // Unrecognised or missing stage — reply gracefully so the operator knows what to send
      const hint = event.stage
        ? t().stageNotRecognized(event.stage)
        : t().noStageDetected;
      const replyText = `${hint} ${t().stageKeywordHint}`;
      logger.warn({ contact_id: event.contact_id, hint }, 'Stage validation failed');
      await sendReply(event.contact_id, replyText);
      await logSessionToDb(db, session_id, event, 'coordinator', [], replyText);
      return;
    }
  }

  logger.info({ contact_id: event.contact_id, stage: event.stage, cluster }, 'Stage resolved — routing to specialist');

  // 3. Fetch cross-stage history (gives specialist context about other stages)
  const crossStageHistory = await buildCrossStageHistory(db, event.contact_id, logger);

  // 4. Attach routing metadata to event (including session_id so specialists reuse it)
  event.meta = {
    ...event.meta,
    cross_stage_history: crossStageHistory,
    routed_by: 'coordinator',
    cluster,
    session_id, // Specialists read this to avoid creating a duplicate session row
  };

  // 5. Route to specialist
  logger.debug({ contact_id: event.contact_id, cluster }, 'Routing to specialist');
  await CLUSTER_RUNNERS[cluster](db, event);
}
