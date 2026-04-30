import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const offset = (page - 1) * limit;

    const activitiesQuery = `
      SELECT id, action_id, stage, status, session_id, created_at
      FROM filter_log
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    const countQuery = `SELECT COUNT(*) FROM filter_log`;

    const [activitiesResult, countResult] = await Promise.all([
      query(activitiesQuery, [limit, offset]),
      query(countQuery)
    ]);

    const total = parseInt(countResult.rows[0].count, 10);

    return NextResponse.json({
      activities: activitiesResult.rows,
      total,
      page,
      hasMore: offset + limit < total
    });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch activity logs from database');
    return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
  }
}
