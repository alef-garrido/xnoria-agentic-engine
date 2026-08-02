import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('contactId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (!contactId) {
      return NextResponse.json({ error: 'contactId is required' }, { status: 400 });
    }

    const result = await query(
      `SELECT id, contact_id, channel, stage, signal_id, signal_severity, cause_code, input, created_at
       FROM cognitive_session
       WHERE contact_id = $1 AND signal_id IS NOT NULL
       ORDER BY created_at DESC
       LIMIT $2`,
      [contactId, limit]
    );

    return NextResponse.json({
      contact_id: contactId,
      signals: result.rows.map((row) => ({
        session_id: row.id,
        channel: row.channel,
        stage: row.stage,
        signal_id: row.signal_id,
        signal_severity: row.signal_severity === null ? null : Number(row.signal_severity),
        cause_code: row.cause_code,
        input: row.input,
        created_at: row.created_at,
      })),
    });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch radar signals from database');
    return NextResponse.json({ error: 'Failed to fetch radar signals' }, { status: 500 });
  }
}
