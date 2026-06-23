import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

const FILTER_URL = process.env.FILTER_URL ?? 'http://filter:3000';

// POST /api/filter/hitl/[logId]/approve → proxy to POST /filter/hitl/:logId/approve
// Optional body: { payload: { ... } } — operator-edited payload override
export async function POST(
  request: Request,
  { params }: { params: Promise<{ logId: string }> }
) {
  const { logId } = await params;

  try {
    // Forward the body as-is (may contain payload override)
    let body: Record<string, unknown> | undefined;
    try {
      body = await request.json();
    } catch {
      // No body or invalid JSON — approve with original payload
      body = undefined;
    }

    const res = await fetch(`${FILTER_URL}/filter/hitl/${logId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : '{}'
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    logger.error({ error, logId }, 'Failed to proxy HITL approve request');
    return NextResponse.json({ error: 'Failed to reach filter service' }, { status: 502 });
  }
}
