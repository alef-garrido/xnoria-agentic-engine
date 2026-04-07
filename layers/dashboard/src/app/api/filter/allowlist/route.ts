import { NextResponse } from 'next/server';

const FILTER_URL = process.env.FILTER_URL ?? 'http://filter:3000';

// GET /api/filter/allowlist → proxy to GET /filter/allowlist
export async function GET() {
  try {
    const res = await fetch(`${FILTER_URL}/filter/allowlist`, {
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
    console.error('[dashboard] Failed to proxy allowlist list:', error);
    return NextResponse.json({ error: 'Failed to reach filter service' }, { status: 502 });
  }
}

// POST /api/filter/allowlist → proxy to POST /filter/allowlist
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const res = await fetch(`${FILTER_URL}/filter/allowlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[dashboard] Failed to proxy allowlist create:', error);
    return NextResponse.json({ error: 'Failed to reach filter service' }, { status: 502 });
  }
}
