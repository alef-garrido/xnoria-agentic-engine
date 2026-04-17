// ==============================================================================
// Exnoria · Dashboard · /api/admin/operators
// Admin-only operator management endpoints.
//
// GET  — list all operators
// POST — create a new operator with a temporary password
//
// Authorization: admin role required for all methods.
//
// Creating an operator via CLI (alternative to POST):
//   docker exec exnoria_dashboard node -e \
//     "require('bcrypt').hash('password', 12).then(h => console.log(h))"
//   docker exec exnoria_postgres psql -U postgres -d exnoria -c \
//     "INSERT INTO operators (handle, display_name, role, password_hash)
//      VALUES ('handle', 'Display Name', 'operator', '<hash>');"
// ==============================================================================

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

const BCRYPT_COST = 12;

// --------------------------------------------------------------------------
// GET /api/admin/operators
// Returns all operators (id, handle, display_name, role, disabled, last_login_at)
// Never returns password_hash.
// --------------------------------------------------------------------------
export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const result = await query(
    `SELECT id, handle, display_name, role, disabled, last_login_at,
            failed_attempts, locked_until, password_changed, created_at
     FROM operators
     ORDER BY created_at ASC`
  );

  return NextResponse.json({ operators: result.rows });
}

// --------------------------------------------------------------------------
// POST /api/admin/operators
// Creates a new operator with the given role and a temporary password.
// Sets password_changed = false so the operator is forced to change on login.
//
// Body: { handle, display_name, role, password }
//   handle       — unique short identifier (e.g. "alice")
//   display_name — full name for UI display
//   role         — "admin" | "operator" | "viewer"
//   password     — temporary password (operator must change on first login)
// --------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let handle: string | undefined;
  let display_name: string | undefined;
  let role: string | undefined;
  let password: string | undefined;

  try {
    const body  = await request.json();
    handle       = body.handle;
    display_name = body.display_name;
    role         = body.role;
    password     = body.password;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // Validate required fields
  if (!handle || !display_name || !role || !password) {
    return NextResponse.json(
      { error: 'Missing required fields: handle, display_name, role, password' },
      { status: 400 }
    );
  }

  // Validate role
  const VALID_ROLES = ['admin', 'operator', 'viewer'];
  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json(
      { error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` },
      { status: 400 }
    );
  }

  // Validate password length
  if (password.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters' },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  try {
    const result = await query(
      `INSERT INTO operators (handle, display_name, role, password_hash, password_changed)
       VALUES ($1, $2, $3, $4, false)
       RETURNING id, handle, display_name, role, created_at`,
      [handle, display_name, role, passwordHash]
    );

    return NextResponse.json(
      { operator: result.rows[0] },
      { status: 201 }
    );
  } catch (err: unknown) {
    // Unique constraint violation on handle
    if (
      err instanceof Error &&
      err.message.includes('unique') &&
      err.message.includes('handle')
    ) {
      return NextResponse.json(
        { error: `Operator handle '${handle}' is already taken` },
        { status: 409 }
      );
    }
    throw err;
  }
}
