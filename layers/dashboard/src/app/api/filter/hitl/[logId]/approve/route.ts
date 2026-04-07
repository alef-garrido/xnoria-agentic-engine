import { NextResponse } from 'next/server';

const FILTER_URL = process.env.FILTER_URL ?? 'http://filter:3000';

// POST /api/filter/hitl/[logId]/approve → proxy to POST /filter/hitl/:logId/approve
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ logId: string }> }
) {
  const { logId } = await params;

  try {
    const res = await fetch(`${FILTER_URL}/filter/hitl/${logId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[dashboard] Failed to proxy HITL approve:', error);
    return NextResponse.json({ error: 'Failed to reach filter service' }, { status: 502 });
  }
}
