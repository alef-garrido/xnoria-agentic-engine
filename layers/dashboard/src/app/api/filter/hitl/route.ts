import { NextResponse } from 'next/server';

const FILTER_URL = process.env.FILTER_URL ?? 'http://filter:3000';

// GET /api/filter/hitl → proxy to GET /filter/hitl/pending
export async function GET() {
  try {
    const res = await fetch(`${FILTER_URL}/filter/hitl/pending`, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    });

    if (!res.ok) {
      const error = await res.text();
      return NextResponse.json({ error: 'Filter service error', details: error }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[dashboard] Failed to proxy HITL pending:', error);
    return NextResponse.json({ error: 'Failed to reach filter service' }, { status: 502 });
  }
}
