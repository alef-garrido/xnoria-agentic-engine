// ==============================================================================
// Exnoria · Cognitive · Diagnosis context
// Deterministic context gathering for the on-demand diagnosis service.
//
// Sources (all read-only):
//   - Live signal history: cognitive_session rows with signal_id
//   - Prior sessions' executed actions (cognitive_session.actions_taken)
//   - Prior completed diagnoses + action plans for the same contact
//   - Compass signal catalog + interventions (in-process)
//   - Optional CRM profile resolution via filter acq.contact.get (email lookup)
// ==============================================================================
import { Pool } from "pg";
import { COMPASS_SIGNALS } from "../mcp/compass-data";
import { dispatchToFilter } from "../agent/dispatch";
import { createLogger } from "../../../shared/logging";

const logger = createLogger("diagnosis-context", "cognitive");

export interface SignalEvent {
  signal_id: string;
  signal_severity: number | null;
  cause_code: string | null;
  stage: string | null;
  input: string | null;
  created_at: string;
}

export interface PriorActionOutcome {
  action_id: string;
  status: string;
  created_at: string;
}

export interface DiagnosisContext {
  signal_events: SignalEvent[];
  executed_actions: PriorActionOutcome[];
  prior_diagnoses: { id: string; created_at: string; summary?: string }[];
  prior_plans: { id: string; created_at: string; item_count: number }[];
  catalog: {
    signal_id: string;
    name: string;
    domain: string;
    cause_code: string;
    severity: number;
  }[];
  low_data: boolean;
}

/** Read the contact's live signal history and prior engagements from Postgres. */
export async function gatherContext(db: Pool, contactId: string): Promise<DiagnosisContext> {
  const signalResult = await db.query(
    `SELECT signal_id, signal_severity, cause_code, stage, input, created_at
       FROM cognitive_session
      WHERE contact_id = $1 AND signal_id IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 50`,
    [contactId]
  );

  const actionsResult = await db.query(
    `SELECT jsonb_array_elements(actions_taken) AS action, created_at
       FROM cognitive_session
      WHERE contact_id = $1 AND actions_taken IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 30`,
    [contactId]
  );

  const priorDiagResult = await db.query(
    `SELECT id, created_at, result->>'summary' AS summary
       FROM diagnosis
      WHERE contact_id = $1 AND status = 'completed' AND result IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 3`,
    [contactId]
  );

  const priorPlanResult = await db.query(
    `SELECT id, created_at, jsonb_array_length(items)::int AS item_count
       FROM action_plan
      WHERE contact_id = $1
      ORDER BY created_at DESC
      LIMIT 3`,
    [contactId]
  );

  const executedActions: PriorActionOutcome[] = [];
  for (const row of actionsResult.rows) {
    const action = row.action as { action_id?: string; status?: string } | null;
    if (action?.action_id && action.status) {
      executedActions.push({
        action_id: action.action_id,
        status: action.status,
        created_at: row.created_at,
      });
    }
  }

  const signalEvents: SignalEvent[] = (signalResult.rows as SignalEvent[]).map((row) => ({
    signal_id: row.signal_id,
    signal_severity: row.signal_severity === null ? null : Number(row.signal_severity),
    cause_code: row.cause_code,
    stage: row.stage,
    input: row.input,
    created_at: row.created_at,
  }));

  const catalog = COMPASS_SIGNALS.map((s) => ({
    signal_id: s.signal_id,
    name: s.name,
    domain: s.domain,
    cause_code: s.cause_code,
    severity: s.severity,
  }));

  const hasCrmProfile = executedActions.some(
    (a) => a.action_id === "acq.contact.get" || a.action_id === "acq.contact.upsert"
  );

  return {
    signal_events: signalEvents,
    executed_actions: executedActions,
    prior_diagnoses: (
      priorDiagResult.rows as { id: string; created_at: string; summary?: string }[]
    ).map((r) => ({ id: r.id, created_at: r.created_at, summary: r.summary ?? undefined })),
    prior_plans: (
      priorPlanResult.rows as { id: string; created_at: string; item_count: number }[]
    ).map((r) => ({ id: r.id, created_at: r.created_at, item_count: Number(r.item_count) })),
    catalog,
    low_data: signalEvents.length === 0 && !hasCrmProfile,
  };
}

/** Resolve a lead by email via the filter (HubSpot read — acq.contact.get). */
export async function resolveContactByEmail(email: string): Promise<string | null> {
  try {
    const res = await dispatchToFilter({
      action_id: "acq.contact.get",
      stage: "ACQ",
      session_id: `diagnose-email-${Date.now()}`,
      contact_id: `email:${email}`,
      payload: { email },
    });

    const wr = (res.workflow_result ?? {}) as Record<string, unknown>;
    const candidate = wr.contact_id ?? wr.id ?? wr.vid ?? wr.contactId;
    if (typeof candidate === "string" && candidate.length > 0) return candidate;
    return null;
  } catch (err) {
    logger.warn(
      { err, email },
      "CRM email resolution failed — diagnosing with email-only identity"
    );
    return null;
  }
}
