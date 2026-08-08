import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { logger } from "@/lib/logger";
import type { PlanDto } from "@/lib/diagnosis";

// GET /api/diagnose/plan/[planId] — a single action plan (direct DB read)
export async function GET(_request: Request, { params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params;

  try {
    const result = await query("SELECT * FROM action_plan WHERE id = $1", [planId]);
    const row = result.rows[0];
    if (!row) {
      return NextResponse.json({ error: "PLAN_NOT_FOUND" }, { status: 404 });
    }

    const plan: PlanDto = {
      id: row.id,
      diagnosis_id: row.diagnosis_id,
      contact_id: row.contact_id,
      status: row.status,
      items: Array.isArray(row.items) ? row.items : [],
      model: row.model,
      created_at: row.created_at,
    };

    return NextResponse.json(plan);
  } catch (error) {
    logger.error({ error, planId }, "Failed to fetch action plan from database");
    return NextResponse.json({ error: "Failed to fetch action plan" }, { status: 500 });
  }
}
