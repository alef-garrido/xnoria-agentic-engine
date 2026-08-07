import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const result = await query(
      `SELECT DISTINCT ON (contact_id)
         contact_id,
         channel,
         stage,
         signal_id,
         signal_severity,
         cause_code,
         created_at AS last_seen,
         COUNT(*) OVER (PARTITION BY contact_id) AS session_count
       FROM cognitive_session
       WHERE signal_id IS NOT NULL
       ORDER BY contact_id, created_at DESC`
    );

    return NextResponse.json({
      contacts: result.rows.map((row) => ({
        contact_id: row.contact_id,
        channel: row.channel,
        stage: row.stage,
        signal_id: row.signal_id,
        signal_severity: row.signal_severity === null ? null : Number(row.signal_severity),
        cause_code: row.cause_code,
        last_seen: row.last_seen,
        session_count: Number(row.session_count),
      })),
    });
  } catch (error) {
    logger.error({ error }, "Failed to fetch radar contacts from database");
    return NextResponse.json({ error: "Failed to fetch radar contacts" }, { status: 500 });
  }
}
