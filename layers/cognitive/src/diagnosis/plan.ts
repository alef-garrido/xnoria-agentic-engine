// ==============================================================================
// Exnoria · Cognitive · Action plan job
// Generates a prioritized action plan from a completed diagnosis.
// The plan is validated against the filter allowlist (enabled actions only) —
// if the model proposes an unregistered action it is dropped.
// ==============================================================================
import { Pool } from "pg";
import { getInterventions } from "../mcp/compass-data";
import { callPlan } from "./llm";
import { DiagnosisResult, PlanItem } from "./types";
import { recordDiagnosisOutcome, PlanMemoryInput } from "../memory/engram";
import { createLogger } from "../../../shared/logging";

const logger = createLogger("plan-job", "cognitive");

const MAX_PLAN_ITEMS = 5;

interface AllowAction {
  action_id: string;
  stage: string;
  requires_hitl: boolean;
  description: string | null;
}

async function readAllowlist(db: Pool): Promise<AllowAction[]> {
  const res = await db.query(
    `SELECT action_id, stage, requires_hitl, description
       FROM filter_action
      WHERE enabled = true
      ORDER BY action_id`
  );
  return res.rows as AllowAction[];
}

/** Keep only plan items whose action_id is enabled in the allowlist. */
export function sanitizePlanItems(raw: unknown[], allowlist: AllowAction[]): PlanItem[] {
  const allowed = new Map(allowlist.map((a) => [a.action_id, a]));
  const items: PlanItem[] = [];

  for (const item of raw.slice(0, MAX_PLAN_ITEMS)) {
    const p = item as Partial<PlanItem>;
    if (typeof p.action_id !== "string" || !allowed.has(p.action_id)) continue;

    const action = allowed.get(p.action_id)!;
    const rank = typeof p.rank === "number" ? Math.max(1, Math.floor(p.rank)) : items.length + 1;

    items.push({
      rank,
      action_id: p.action_id,
      stage: action.stage,
      priority:
        p.priority === "P0" || p.priority === "P1" || p.priority === "P2" ? p.priority : "P2",
      rationale: typeof p.rationale === "string" ? p.rationale.slice(0, 600) : "",
      expected_outcome:
        typeof p.expected_outcome === "string" ? p.expected_outcome.slice(0, 600) : "",
      requires_hitl: action.requires_hitl,
      signal_id: typeof p.signal_id === "string" ? p.signal_id : undefined,
      payload:
        p.payload && typeof p.payload === "object" ? (p.payload as Record<string, unknown>) : {},
    });
  }

  return items.slice(0, MAX_PLAN_ITEMS);
}

/**
 * Generate an action plan for a completed diagnosis and persist it.
 * Fails (logs, no throw) if the diagnosis is missing, not completed, or the
 * LLM produces nothing usable.
 */
export async function generatePlan(db: Pool, diagnosisId: string): Promise<string | null> {
  try {
    const diagResult = await db.query(
      "SELECT id, contact_id, email, status, result, model FROM diagnosis WHERE id = $1",
      [diagnosisId]
    );
    const diag = diagResult.rows[0];
    if (!diag) {
      logger.warn({ diagnosis_id: diagnosisId }, "Plan requested for missing diagnosis");
      return null;
    }
    if (diag.status !== "completed" || !diag.result) {
      logger.warn(
        { diagnosis_id: diagnosisId, status: diag.status },
        "Plan requested before diagnosis completed"
      );
      return null;
    }

    const allowlist = await readAllowlist(db);

    // Collect interventions tied to the findings' signals so the planner can
    // ground its suggestions in the Compass framework.
    const result = diag.result as Partial<DiagnosisResult>;
    const interventions = (result.findings ?? [])
      .flatMap((f) => getInterventions(f.signal_id))
      .map((i) => ({ id: i.id, option: i.option, description: i.description }));

    const contextBlock = JSON.stringify(
      {
        contact_id: diag.contact_id,
        diagnosis: diag.result,
        interventions_for_findings: interventions,
        allowlist: allowlist.map((a) => ({
          action_id: a.action_id,
          stage: a.stage,
          requires_hitl: a.requires_hitl,
          description: a.description,
        })),
      },
      null,
      2
    );

    const res = await callPlan(contextBlock);
    const items = sanitizePlanItems(res.value.items, allowlist);
    if (items.length === 0) {
      logger.warn({ diagnosis_id: diagnosisId }, "Plan returned no usable items");
      return null;
    }

    items.sort((a, b) => a.rank - b.rank);

    const planResult = await db.query(
      `INSERT INTO action_plan (diagnosis_id, contact_id, status, items, model)
       VALUES ($1, $2, 'generated', $3::jsonb, $4)
       RETURNING id`,
      [diagnosisId, diag.contact_id, JSON.stringify(items), res.model]
    );
    const planId = planResult.rows[0].id as string;
    logger.info(
      { plan_id: planId, diagnosis_id: diagnosisId, items: items.length },
      "Action plan generated"
    );

    // Attach the plan to the Engram diagnosis note (fire-and-forget).
    const planMemory: PlanMemoryInput = {
      planId,
      items: items.map((i) => ({
        rank: i.rank,
        action_id: i.action_id,
        stage: i.stage,
        priority: i.priority,
        rationale: i.rationale,
        expected_outcome: i.expected_outcome,
      })),
    };
    void recordDiagnosisOutcome(
      {
        diagnosisId,
        contactId: diag.contact_id,
        email: diag.email ?? null,
        summary: result.summary,
        findings: (result.findings ?? []).map((f) => ({
          signal_id: f.signal_id,
          severity: f.severity,
          cause_code: f.cause_code,
        })),
        stageHealth: result.stage_health,
        model: diag.model,
      },
      planMemory
    );

    return planId;
  } catch (err) {
    logger.error({ err, diagnosis_id: diagnosisId }, "Action plan generation failed");
    return null;
  }
}
