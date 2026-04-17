// ==============================================================================
// Exnoria · Dashboard · POST /api/auth/logout
// Invalidates the session in DB and clears the session cookie.
// ==============================================================================

import { NextResponse } from 'next/server';
import { invalidateSession, SESSION_COOKIE } from '@/lib/auth';

export async function POST() {
  // Delete the session record from the DB (tolerates no-session gracefully)
  await invalidateSession();

  const response = NextResponse.json({ success: true });

  // Clear the cookie regardless of whether a session existed
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   0,
    path:     '/',
  });

  return response;
}
