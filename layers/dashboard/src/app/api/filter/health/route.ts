import { NextResponse } from 'next/server';

const FILTER_URL = process.env.FILTER_URL ?? 'http://filter:3000';

// GET /api/filter/health → proxy to GET /filter/health
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = searchParams.get('days') ?? '30';

    const res = await fetch(`${FILTER_URL}/filter/health?days=${days}`, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    });

    if (!res.ok) {
      const error = await res.text();
      return NextResponse.json(
        { error: 'Filter service error', details: error },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[dashboard] Failed to proxy health metrics:', error);
    return NextResponse.json(
      { error: 'Failed to reach filter service' },
      { status: 502 }
    );
  }
}
