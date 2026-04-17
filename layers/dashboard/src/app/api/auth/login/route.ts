// ==============================================================================
// Exnoria · Dashboard · POST /api/auth/login
// Credential-based login: handle + password → bcrypt verify → session cookie
// ==============================================================================

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { query } from '@/lib/db';
import { createSession, SESSION_COOKIE } from '@/lib/auth';

const SESSION_MAX_AGE = 8 * 60 * 60; // 8 hours in seconds

export async function POST(request: NextRequest) {
  let handle: string | undefined;
  let password: string | undefined;

  try {
    const body = await request.json();
    handle   = body.handle;
    password = body.password;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!handle || !password) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
  }

  // Fetch operator by handle (disabled operators cannot log in)
  const result = await query(
    `SELECT id, handle, display_name, role,
            password_hash, failed_attempts, locked_until, disabled
     FROM operators
     WHERE handle = $1`,
    [handle]
  );

  const operator = result.rows[0] ?? null;

  // Brute-force lockout check (checked before password comparison to prevent
  // timing attacks that reveal whether the account exists)
  if (operator?.locked_until && new Date(operator.locked_until) > new Date()) {
    return NextResponse.json(
      { error: 'Account temporarily locked. Try again later.' },
      { status: 423 }
    );
  }

  // Validate password — same error for bad handle or bad password (prevents enumeration)
  const valid = operator?.password_hash
    ? await bcrypt.compare(password, operator.password_hash)
    : false;

  if (!valid) {
    if (operator) {
      const attempts    = (operator.failed_attempts ?? 0) + 1;
      const lockedUntil = attempts >= 3
        ? new Date(Date.now() + 30 * 60 * 1000) // 30 min lockout
        : null;

      await query(
        `UPDATE operators
         SET failed_attempts = $1,
             locked_until    = $2
         WHERE id = $3`,
        [attempts, lockedUntil, operator.id]
      );
    }

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  // Disabled check (belt-and-suspenders — also filtered in session validation)
  if (operator.disabled) {
    return NextResponse.json({ error: 'Account disabled' }, { status: 403 });
  }

  // Reset brute-force state on successful login
  await query(
    `UPDATE operators
     SET failed_attempts = 0,
         locked_until    = null,
         last_login_at   = now()
     WHERE id = $1`,
    [operator.id]
  );

  // Create persisted session
  const token = await createSession(operator.id, {
    userAgent: request.headers.get('user-agent') ?? undefined,
    ip:        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined,
  });

  const response = NextResponse.json({
    operator: {
      handle:       operator.handle,
      display_name: operator.display_name,
      role:         operator.role,
    },
    // Signal whether a password change is required (first login)
    requires_password_change: operator.password_changed === false,
  });

  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   SESSION_MAX_AGE,
    path:     '/',
  });

  return response;
}
