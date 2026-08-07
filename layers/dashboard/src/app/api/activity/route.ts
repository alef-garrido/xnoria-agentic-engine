import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { logger } from "@/lib/logger";
import { paginate, parsePagination } from "@/lib/pagination";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pagination = parsePagination(searchParams, 50);

    const activitiesQuery = `
      SELECT id, action_id, stage, status, session_id, created_at
      FROM filter_log
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const countQuery = `SELECT COUNT(*) FROM filter_log`;

    const { rows, total, page, hasMore } = await paginate(
      query(activitiesQuery, [pagination.limit, pagination.offset]),
      query(countQuery),
      pagination
    );

    return NextResponse.json({
      activities: rows,
      total,
      page,
      hasMore,
    });
  } catch (error) {
    logger.error({ error }, "Failed to fetch activity logs from database");
    return NextResponse.json({ error: "Failed to fetch activity logs" }, { status: 500 });
  }
}
