import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    
    // We expect cognitive_history to have id, session_id, role, content, created_at
    const historyQuery = `
      SELECT id, role, content, created_at 
      FROM cognitive_history 
      WHERE session_id = $1
      ORDER BY created_at ASC
    `;

    const res = await query(historyQuery, [id]);

    return NextResponse.json({
      history: res.rows
    });
  } catch (error) {
    logger.error({ error, sessionId: id }, 'Failed to fetch session history from database');
    return NextResponse.json({ error: 'Failed to fetch session history' }, { status: 500 });
  }
}
