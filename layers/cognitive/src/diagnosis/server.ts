// ==============================================================================
// Exnoria · Cognitive layer · Diagnosis HTTP endpoint
// Express server for the dashboard's on-demand diagnosis + action plan flow.
//
//   POST /diagnose          {contact_id?, email?, triggered_by?} → 202 {id}
//   GET  /diagnose/:id      → diagnosis row (status/result)
//   POST /diagnose/:id/plan → 202 {plan_id}
//   GET  /diagnose/plan/:id → action_plan row
// Jobs run in-process; the dashboard polls status.
// NOTE: Diagnosis is an operator-invoked cognitive service (read-only). Plans
// are executed by the dashboard through the filter service — never here.
// ==============================================================================
import express, { Request, Response } from "express";
import { Pool } from "pg";
import { v4 as uuid } from "uuid";
import { runDiagnosis } from "./diagnose";
import { generatePlan } from "./plan";
import { resolveContactByEmail } from "./context";
import { ActionPlanRow, DiagnosisRow } from "./types";
import { createLogger } from "../../../shared/logging";

const logger = createLogger("diagnosis-server", "cognitive");

const app = express();
app.use(express.json());

export function startDiagnosisServer(db: Pool) {
  const port = parseInt(process.env.COGNITIVE_DIAGNOSE_PORT ?? "0", 10);
  if (port <= 0) {
    logger.info("Diagnosis endpoint disabled (COGNITIVE_DIAGNOSE_PORT not set)");
    return;
  }

  logger.info({ port }, "Starting diagnosis endpoint");

  // Queue a diagnosis for a contact (by id) or lead (by email, resolved via CRM)
  app.post("/diagnose", async (req: Request, res: Response) => {
    const { contact_id, email, triggered_by } = (req.body ?? {}) as {
      contact_id?: string;
      email?: string;
      triggered_by?: string;
    };

    let targetContactId = typeof contact_id === "string" ? contact_id.trim() : "";
    const targetEmail = typeof email === "string" ? email.trim().toLowerCase() : undefined;

    if (!targetContactId && !targetEmail) {
      return res.status(400).json({
        error: "MISSING_TARGET",
        message: "Provide contact_id or email",
      });
    }

    if (!targetContactId && targetEmail) {
      const resolved = await resolveContactByEmail(targetEmail);
      logger.info({ email: targetEmail, resolved }, "CRM email → contact resolution");
      targetContactId = resolved ?? `email:${targetEmail}`;
    }

    const id = uuid();
    await db.query(
      `INSERT INTO diagnosis (id, contact_id, email, status, triggered_by, input)
       VALUES ($1, $2, $3, 'queued', $4, $5::jsonb)`,
      [
        id,
        targetContactId,
        targetEmail || null,
        typeof triggered_by === "string" ? triggered_by.slice(0, 100) : null,
        JSON.stringify({ contact_id: targetContactId, email: targetEmail ?? null }),
      ]
    );

    // Fire-and-forget job — poll GET /diagnose/:id for the outcome
    void runDiagnosis(db, id).then(() => undefined);

    return res.status(202).json({ id, status: "queued" });
  });

  // Poll the status/result of a diagnosis
  app.get("/diagnose/:id", async (req: Request, res: Response) => {
    const result = await db.query("SELECT * FROM diagnosis WHERE id = $1", [String(req.params.id)]);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: "DIAGNOSIS_NOT_FOUND" });
    return res.json(serializeDiagnosis(row));
  });

  // Generate the prioritized action plan for a completed diagnosis
  app.post("/diagnose/:id/plan", async (req: Request, res: Response) => {
    const planId = await generatePlan(db, String(req.params.id));
    if (!planId) {
      return res.status(409).json({
        error: "PLAN_UNAVAILABLE",
        message: "Diagnosis is not completed or produced no actionable plan",
      });
    }
    return res.status(202).json({ plan_id: planId, status: "generated" });
  });

  // Fetch a plan
  app.get("/diagnose/plan/:planId", async (req: Request, res: Response) => {
    const result = await db.query("SELECT * FROM action_plan WHERE id = $1", [req.params.planId]);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: "PLAN_NOT_FOUND" });
    return res.json(serializePlan(row));
  });

  app.listen(port, () => {
    logger.info({ port }, "Diagnosis endpoint running");
  });
}

function serializeDiagnosis(row: Record<string, unknown>): DiagnosisRow {
  const rawResult = row.result;
  const result =
    typeof rawResult === "string" && rawResult
      ? (JSON.parse(rawResult) as DiagnosisRow["result"] | null)
      : ((rawResult as DiagnosisRow["result"] | null) ?? null);

  return {
    id: row.id as string,
    contact_id: row.contact_id as string,
    email: (row.email as string | null) ?? null,
    status: row.status as DiagnosisRow["status"],
    fail_reason: (row.fail_reason as string | null) ?? null,
    triggered_by: (row.triggered_by as string | null) ?? null,
    input: (row.input as Record<string, unknown>) ?? {},
    result,
    model: (row.model as string | null) ?? null,
    created_at: row.created_at as string,
    completed_at: (row.completed_at as string | null) ?? null,
  };
}

function serializePlan(row: Record<string, unknown>): ActionPlanRow {
  const rawItems = row.items;
  const items = Array.isArray(rawItems)
    ? rawItems
    : typeof rawItems === "string" && rawItems
      ? JSON.parse(rawItems)
      : [];

  return {
    id: row.id as string,
    diagnosis_id: row.diagnosis_id as string,
    contact_id: row.contact_id as string,
    status: row.status as string,
    items,
    model: (row.model as string | null) ?? null,
    created_at: row.created_at as string,
  };
}
