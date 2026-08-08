import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { logger } from "@/lib/logger";
import { cognitiveFetch } from "@/lib/service-client";
import type { DiagnosisDto, PlanDto } from "@/lib/diagnosis";

interface DiagnosisWithPlanRow {
  id: string;
  contact_id: string;
  email: string | null;
  status: string;
  fail_reason: string | null;
  triggered_by: string | null;
  result: unknown;
  model: string | null;
  created_at: string;
  completed_at: string | null;
  plan_id: string | null;
  plan_status: string | null;
  plan_items: unknown;
  plan_model: string | null;
  plan_created_at: string | null;
}

// GET /api/diagnose?contact_id=X — diagnoses + attached plans for a contact (direct DB read)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const contact_id = searchParams.get("contact_id");

  if (!contact_id) {
    return NextResponse.json(
      { error: "MISSING_CONTACT_ID", message: "Missing required parameter: contact_id" },
      { status: 400 }
    );
  }

  try {
    const result = await query(
      `SELECT d.id, d.contact_id, d.email, d.status, d.fail_reason, d.triggered_by,
              d.result, d.model, d.created_at, d.completed_at,
              p.id AS plan_id, p.status AS plan_status, p.items AS plan_items,
              p.model AS plan_model, p.created_at AS plan_created_at
         FROM diagnosis d
         LEFT JOIN action_plan p ON p.diagnosis_id = d.id
        WHERE d.contact_id = $1
        ORDER BY d.created_at DESC
        LIMIT 10`,
      [contact_id]
    );

    const diagnoses: Array<DiagnosisDto & { plan: PlanDto | null }> = (
      result.rows as DiagnosisWithPlanRow[]
    ).map((row) => ({
      id: row.id,
      contact_id: row.contact_id,
      email: row.email,
      status: row.status as DiagnosisDto["status"],
      fail_reason: row.fail_reason,
      triggered_by: row.triggered_by,
      result: row.result as DiagnosisDto["result"],
      model: row.model,
      created_at: row.created_at,
      completed_at: row.completed_at,
      plan: row.plan_id
        ? {
            id: row.plan_id,
            diagnosis_id: row.id,
            contact_id: row.contact_id,
            status: row.plan_status ?? "generated",
            items: (row.plan_items as PlanDto["items"]) ?? [],
            model: row.plan_model,
            created_at: row.plan_created_at ?? "",
          }
        : null,
    }));

    return NextResponse.json({ diagnoses });
  } catch (error) {
    logger.error({ error, contact_id }, "Failed to fetch diagnoses from database");
    return NextResponse.json({ error: "Failed to fetch diagnoses" }, { status: 500 });
  }
}

// POST /api/diagnose — trigger an on-demand diagnosis for a lead/contact
// Body: { contact_id?, email?, triggered_by? } → proxy to cognitive /diagnose
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "INVALID_BODY", message: "Expected JSON body" },
      { status: 400 }
    );
  }

  const { contact_id, email, triggered_by } = (body ?? {}) as {
    contact_id?: string;
    email?: string;
    triggered_by?: string;
  };

  if (!contact_id && !email) {
    return NextResponse.json(
      { error: "MISSING_TARGET", message: "Provide contact_id or email" },
      { status: 400 }
    );
  }

  return cognitiveFetch("/diagnose", {
    method: "POST",
    body: { contact_id, email, triggered_by },
    passThroughErrors: false,
    logMessage: "Failed to trigger diagnosis",
  });
}
