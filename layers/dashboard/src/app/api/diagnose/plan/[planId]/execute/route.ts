import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { logger } from "@/lib/logger";
import { filterFetch } from "@/lib/service-client";
import type { PlanItemDto } from "@/lib/diagnosis";

// POST /api/diagnose/plan/[planId]/execute?item=N
// Executes one item of a generated plan through the filter service (allowlist +
// HITL gate still enforced). Body: { index } — item position in the plan.
export async function POST(request: Request, { params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params;

  let index = 0;
  try {
    const body = (await request.json()) as { index?: number };
    index = typeof body.index === "number" ? body.index : 0;
  } catch {
    // body optional — default to first item
  }

  try {
    const result = await query(`SELECT id, contact_id, items FROM action_plan WHERE id = $1`, [
      planId,
    ]);
    const row = result.rows[0];
    if (!row) {
      return NextResponse.json({ error: "PLAN_NOT_FOUND" }, { status: 404 });
    }

    const items = (row.items as PlanItemDto[]) ?? [];
    const item = items[index];
    if (!item) {
      return NextResponse.json({ error: "ITEM_NOT_FOUND" }, { status: 404 });
    }

    const payload = {
      ...item.payload,
      contact_id: row.contact_id,
      signal_id: item.signal_id,
    };

    return filterFetch("/filter/execute", {
      method: "POST",
      body: {
        action_id: item.action_id,
        stage: item.stage,
        session_id: planId,
        contact_id: row.contact_id,
        signal_id: item.signal_id,
        payload,
        meta: { triggered_by: "action-plan", plan_id: planId, item_rank: item.rank },
      },
      passThroughErrors: false,
      logMessage: "Failed to execute action plan item",
      logContext: { planId, action_id: item.action_id },
    });
  } catch (error) {
    logger.error({ error, planId }, "Failed to execute action plan item");
    return NextResponse.json({ error: "Failed to execute action plan item" }, { status: 500 });
  }
}
