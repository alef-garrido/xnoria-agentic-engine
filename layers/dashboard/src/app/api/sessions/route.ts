import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '25', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const offset = (page - 1) * limit;

    const sessionsQuery = `
      SELECT id, contact_id, channel, stage, input,
        jsonb_array_length(actions_taken) AS actions_taken,
        model, created_at
      FROM cognitive_session
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    const countQuery = `SELECT COUNT(*) FROM cognitive_session`;

    const [sessionsResult, countResult] = await Promise.all([
      query(sessionsQuery, [limit, offset]),
      query(countQuery)
    ]);

    const total = parseInt(countResult.rows[0].count, 10);

    return NextResponse.json({
      sessions: sessionsResult.rows,
      total,
      page,
      hasMore: offset + limit < total
    });
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}
