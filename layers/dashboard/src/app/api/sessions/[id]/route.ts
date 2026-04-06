import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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
    console.error(`Failed to fetch history for session:`, error);
    return NextResponse.json({ error: 'Failed to fetch session history' }, { status: 500 });
  }
}
