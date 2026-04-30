import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

const COGNITIVE_MEMORY_URL = process.env.COGNITIVE_MEMORY_URL ?? 'http://cognitive:3001';

// GET /api/memory?contact_id=X&stage=Y → proxy to GET /memory/search
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const contact_id = searchParams.get('contact_id');
    const stage = searchParams.get('stage');

    if (!contact_id) {
      return NextResponse.json(
        { error: 'MISSING_CONTACT_ID', message: 'Missing required parameter: contact_id' },
        { status: 400 }
      );
    }

    // Build the query string
    const queryParams = new URLSearchParams();
    queryParams.set('contact_id', contact_id);
    if (stage) queryParams.set('stage', stage);

    const res = await fetch(`${COGNITIVE_MEMORY_URL}/memory/search?${queryParams}`, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    });

    if (!res.ok) {
      const error = await res.json();
      return NextResponse.json(
        { error: 'Memory service error', details: error },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    logger.error({ error }, 'Failed to proxy memory search to cognitive service');
    return NextResponse.json(
      { error: 'Failed to reach memory service' },
      { status: 502 }
    );
  }
}