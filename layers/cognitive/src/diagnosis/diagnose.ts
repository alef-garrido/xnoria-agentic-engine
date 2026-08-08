// ==============================================================================
// Exnoria · Cognitive · On-demand diagnosis job
// One diagnosis per contact: persists → LLM → validated result → stored.
// Read-only with respect to external systems — nothing is executed here.
// ==============================================================================
import { Pool } from "pg";
import { getSignal, getInterventions } from "../mcp/compass-data";
import { gatherContext } from "./context";
import { callDiagnosis } from "./llm";
import { DiagnosisFinding, DiagnosisResult } from "./types";
import { JourneyStage } from "../shared/types";
import { recordDiagnosisOutcome } from "../memory/engram";
import { createLogger } from "../../../shared/logging";

const logger = createLogger("diagnosis-job", "cognitive");

const STAGES: JourneyStage[] = ["ACQ", "SAL", "ONB", "PRD", "SUP", "COM", "RET", "EXP"];

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

/** Validate raw LLM findings against the Compass catalog — drop unknowns. */
export function sanitizeFindings(raw: unknown[]): DiagnosisFinding[] {
  const findings: DiagnosisFinding[] = [];
  for (const item of raw.slice(0, 12)) {
    const f = item as Partial<DiagnosisFinding>;
    const signal = typeof f.signal_id === "string" ? getSignal(f.signal_id) : undefined;
    if (!signal) continue;

    const validInterventions = Array.isArray(f.intervention_ids)
      ? f.intervention_ids.filter((id) =>
          getInterventions(signal.signal_id).some((i) => i.id === id)
        )
      : [];

    findings.push({
      signal_id: signal.signal_id,
      stage: signal.domain,
      cause_code: signal.cause_code,
      severity: typeof f.severity === "number" ? clamp(f.severity) : signal.severity,
      confidence: typeof f.confidence === "number" ? clamp(f.confidence) : 0.5,
      evidence: typeof f.evidence === "string" ? f.evidence.slice(0, 500) : "",
      intervention_ids: validInterventions,
    });
  }
  return findings;
}

/** Normalize a raw LLM diagnosis into a validated, complete DiagnosisResult. */
export function validateDiagnosis(raw: DiagnosisResult): DiagnosisResult {
  const stageHealth = STAGES.map((stage) => {
    const match = (raw.stage_health ?? []).find((s) => s.stage === stage);
    const score = match && typeof match.score === "number" ? clamp(match.score) : 0.55;
    return { stage, score };
  });

  return {
    stage_health: stageHealth,
    findings: sanitizeFindings(Array.isArray(raw.findings) ? raw.findings : []),
    summary:
      typeof raw.summary === "string" && raw.summary.trim()
        ? raw.summary.slice(0, 1000)
        : "Diagnosis completed.",
    low_data: raw.low_data === true,
  };
}

/**
 * Execute the diagnosis pipeline for one diagnosis row.
 * Transitions queued → running → completed|failed. Never throws.
 */
export async function runDiagnosis(db: Pool, diagnosisId: string): Promise<void> {
  try {
    const rowResult = await db.query("SELECT id, contact_id, email FROM diagnosis WHERE id = $1", [
      diagnosisId,
    ]);
    const row = rowResult.rows[0];
    if (!row) {
      logger.warn({ diagnosis_id: diagnosisId }, "Diagnosis row not found");
      return;
    }

    await db.query("UPDATE diagnosis SET status = 'running', completed_at = NULL WHERE id = $1", [
      diagnosisId,
    ]);

    const context = await gatherContext(db, row.contact_id);
    const contextBlock = JSON.stringify(
      {
        contact_id: row.contact_id,
        email: row.email ?? null,
        live_signal_events: context.signal_events,
        executed_actions: context.executed_actions,
        prior_diagnoses: context.prior_diagnoses,
        prior_plans: context.prior_plans,
        signal_catalog: context.catalog,
      },
      null,
      2
    );

    const res = await callDiagnosis(contextBlock);
    const result = validateDiagnosis(res.value);

    await db.query(
      `UPDATE diagnosis
          SET status = 'completed', result = $2, model = $3, fail_reason = NULL, completed_at = now()
        WHERE id = $1`,
      [diagnosisId, JSON.stringify(result), res.model]
    );
    logger.info(
      { diagnosis_id: diagnosisId, contact_id: row.contact_id, findings: result.findings.length },
      "Diagnosis completed"
    );

    // Persist to Engram (fire-and-forget — memory failure never blocks diagnosis).
    void recordDiagnosisOutcome({
      diagnosisId,
      contactId: row.contact_id,
      email: row.email ?? null,
      summary: result.summary,
      findings: result.findings.map((f) => ({
        signal_id: f.signal_id,
        severity: f.severity,
        cause_code: f.cause_code,
      })),
      stageHealth: result.stage_health,
      model: res.model,
    });
  } catch (err) {
    logger.error({ err, diagnosis_id: diagnosisId }, "Diagnosis failed");
    await db.query("UPDATE diagnosis SET status = 'failed', fail_reason = $2 WHERE id = $1", [
      diagnosisId,
      err instanceof Error ? err.message.slice(0, 500) : String(err),
    ]);
  }
}
