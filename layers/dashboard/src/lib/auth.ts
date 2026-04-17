// ==============================================================================
// Exnoria · Dashboard · Auth utilities
// Session creation, validation, and invalidation using bcrypt-hashed tokens.
//
// Performance note (IMPORTANT):
//   validateSession() does a bcrypt.compare loop over all active sessions.
//   At 1–5 operators this is fine. At 20+ operators or high-frequency requests,
//   switch to a token-prefix index pattern:
//     1. Store first 8 chars of raw token in operator_sessions.token_prefix (indexed)
//     2. Query WHERE token_prefix = token.slice(0,8) to narrow the set
//     3. Then bcrypt.compare only against the matching rows
//   Scoped to Phase 5 as a scaling concern.
// ==============================================================================

import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { query } from './db';

export const SESSION_COOKIE = 'xnoria_session';
const SESSION_TTL_HOURS = 8;
const BCRYPT_COST = 12;

export interface AuthOperator {
  id: string;
  handle: string;
  display_name: string;
  role: 'admin' | 'operator' | 'viewer';
}

// --------------------------------------------------------------------------
// createSession
// Generates a 32-byte cryptographically random token, hashes it with bcrypt,
// and persists the hash. Returns the raw token — caller sets it as the cookie.
// --------------------------------------------------------------------------
export async function createSession(
  operatorId: string,
  meta: { userAgent?: string; ip?: string }
): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const tokenHash = await bcrypt.hash(token, BCRYPT_COST);

  await query(
    `INSERT INTO operator_sessions (operator_id, token_hash, user_agent, ip_address, expires_at)
     VALUES ($1, $2, $3, $4, now() + INTERVAL '${SESSION_TTL_HOURS} hours')`,
    [operatorId, tokenHash, meta.userAgent ?? null, meta.ip ?? null]
  );

  return token;
}

// --------------------------------------------------------------------------
// validateSession
// Reads the session cookie, finds all non-expired sessions in DB,
// bcrypt-compares the cookie token against each hash.
// On match: slides the TTL window (updates last_seen_at + extends expires_at).
// Returns the operator record or null if no valid session exists.
// --------------------------------------------------------------------------
export async function validateSession(): Promise<AuthOperator | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const sessions = await query(
    `SELECT s.token_hash, s.id AS session_id,
            o.id, o.handle, o.display_name, o.role
     FROM operator_sessions s
     JOIN operators o ON o.id = s.operator_id
     WHERE s.expires_at > now()
       AND o.disabled = false`
  );

  for (const session of sessions.rows) {
    const match = await bcrypt.compare(token, session.token_hash);
    if (match) {
      // Slide the idle window: update last_seen_at and extend expires_at
      await query(
        `UPDATE operator_sessions
         SET last_seen_at = now(),
             expires_at   = now() + INTERVAL '${SESSION_TTL_HOURS} hours'
         WHERE id = $1`,
        [session.session_id]
      );

      return {
        id:           session.id,
        handle:       session.handle,
        display_name: session.display_name,
        role:         session.role,
      };
    }
  }

  return null;
}

// --------------------------------------------------------------------------
// invalidateSession
// Finds the session matching the cookie token and deletes it from the DB.
// --------------------------------------------------------------------------
export async function invalidateSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return;

  const sessions = await query(
    `SELECT id, token_hash FROM operator_sessions WHERE expires_at > now()`
  );

  for (const session of sessions.rows) {
    const match = await bcrypt.compare(token, session.token_hash);
    if (match) {
      await query('DELETE FROM operator_sessions WHERE id = $1', [session.id]);
      break;
    }
  }
}

// --------------------------------------------------------------------------
// requireAuth
// Convenience wrapper for API routes: validates session and returns operator
// or throws a structured error object for the route to turn into a response.
// Usage:
//   const operator = await requireAuth();
//   if ('error' in operator) return NextResponse.json(operator, { status: operator.status });
// --------------------------------------------------------------------------
export async function requireAuth(): Promise<AuthOperator | { error: string; status: number }> {
  const operator = await validateSession();
  if (!operator) return { error: 'Unauthorized', status: 401 };
  return operator;
}

// --------------------------------------------------------------------------
// requireAdmin
// Like requireAuth but also asserts admin role.
// --------------------------------------------------------------------------
export async function requireAdmin(): Promise<AuthOperator | { error: string; status: number }> {
  const result = await requireAuth();
  if ('error' in result) return result;
  if (result.role !== 'admin') return { error: 'Forbidden', status: 403 };
  return result;
}
