import { NextResponse } from 'next/server';

const FILTER_URL = process.env.FILTER_URL ?? 'http://filter:3000';

// PATCH /api/filter/allowlist/[id] → proxy to PATCH /filter/allowlist/:id
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();

    const res = await fetch(`${FILTER_URL}/filter/allowlist/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[dashboard] Failed to proxy allowlist update:', error);
    return NextResponse.json({ error: 'Failed to reach filter service' }, { status: 502 });
  }
}

// DELETE /api/filter/allowlist/[id] → proxy to DELETE /filter/allowlist/:id
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const res = await fetch(`${FILTER_URL}/filter/allowlist/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[dashboard] Failed to proxy allowlist delete:', error);
    return NextResponse.json({ error: 'Failed to reach filter service' }, { status: 502 });
  }
}
