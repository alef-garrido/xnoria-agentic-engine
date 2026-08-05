import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { logger } from "@/lib/logger";
import { paginate, parsePagination } from "@/lib/pagination";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pagination = parsePagination(searchParams, 25);

    const sessionsQuery = `
      SELECT id, contact_id, channel, stage, input,
        jsonb_array_length(actions_taken) AS actions_taken,
        model, created_at
      FROM cognitive_session
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const countQuery = `SELECT COUNT(*) FROM cognitive_session`;

    const { rows, total, page, hasMore } = await paginate(
      query(sessionsQuery, [pagination.limit, pagination.offset]),
      query(countQuery),
      pagination
    );

    return NextResponse.json({
      sessions: rows,
      total,
      page,
      hasMore,
    });
  } catch (error) {
    logger.error({ error }, "Failed to fetch cognitive sessions from database");
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}
