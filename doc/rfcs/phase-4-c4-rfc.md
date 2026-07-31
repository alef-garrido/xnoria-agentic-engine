# RFC: Phase 4 — C4 Role-Based Access

**Status:** Ready for Implementation  
**Date:** April 2026  
**Scope:** Replace single-user cookie auth with credential-based multi-operator access. Define the role model for future client handoff. No client-facing UI yet — foundation only.

---

## Executive Summary

The current dashboard uses a single shared cookie (`mc_auth`) for authentication. There is no concept of who is logged in — every session is the same operator. This blocks client handoff because clients cannot be given isolated access to their own data.

C4 replaces this with username + password authentication per operator, a three-role model (admin, operator, viewer), and the audit trail linkage that ties `filter_log.reviewed_by` to a real operator identity. The client-facing role and per-client data isolation are defined but not populated — that work happens in Phase 5.

The operators table foundation was already created in migration 011. C4 builds on it.

---

## Role Model

Three roles, deliberately minimal:

| Role | Who it's for | What they can do |
|---|---|---|
| `admin` | System owner | Everything — full dashboard, operator management, allowlist, HITL, memory, health |
| `operator` | Internal team member | Full dashboard except operator management — cannot add/remove other operators |
| `viewer` | Future client role | Read-only — health map and memory browser for their own contacts only |

**Current state:** One `admin` row exists (migration 011 seed). No `operator` or `viewer` rows until needed.

**Phase 5 trigger:** When a client is onboarded, a `viewer` row is created scoped to their data. Per-client data isolation is a Phase 5 concern — C4 defines the role, not the isolation logic.

**Design constraint:** Do not build client isolation logic in C4. The `viewer` role exists in the schema and the middleware knows to check for it, but the data filtering that shows a viewer only their own contacts is Phase 5 work. A viewer logging in during Phase 4 sees the full dashboard — same as operator. The role is planted, not activated.

---

## Authentication Model

### Credential storage

Add password fields to the `operators` table:

```sql
-- 012_operators_credentials.sql

ALTER TABLE operators
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS last_login_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failed_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until   TIMESTAMPTZ;
```

Password hashing: **bcrypt**, cost factor 12. Never store plaintext. Never store MD5 or SHA-1.

### Session model

Replace the current `mc_auth` cookie with a proper session:

```sql
-- also in 012_operators_credentials.sql

CREATE TABLE IF NOT EXISTS operator_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id  UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  token_hash   TEXT NOT NULL UNIQUE,   -- bcrypt hash of the session token
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '8 hours',
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_agent   TEXT,
  ip_address   TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON operator_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_operator_id ON operator_sessions(operator_id);
```

Session token: 32-byte cryptographically random value, sent as `HttpOnly; Secure; SameSite=Strict` cookie named `xnoria_session`. The token itself is never stored — only its bcrypt hash. On each request, the token from the cookie is hashed and compared against `operator_sessions.token_hash`.

Session expiry: 8 hours idle timeout. `last_seen_at` updated on every authenticated request. Sessions older than 8 hours from `last_seen_at` are rejected and pruned.

### Brute force protection

Three failed login attempts within 15 minutes locks the account for 30 minutes (`locked_until = now() + INTERVAL '30 minutes'`). This is enforced in the login route handler, not middleware.

---

## Filter Log Linkage

`filter_log.reviewed_by` currently stores `"admin"` — a string with no FK relationship. C4 links it to the operators table properly.

```sql
-- 012_operators_credentials.sql (continued)

-- Add operator_id FK to filter_log for HITL reviews
ALTER TABLE filter_log
  ADD COLUMN IF NOT EXISTS reviewed_by_operator_id UUID REFERENCES operators(id);
```

The existing `reviewed_by TEXT` column stays for backward compatibility — it continues to store the operator's handle as a human-readable string. The new `reviewed_by_operator_id` adds the proper FK. Both are written on HITL approval/rejection.

Update the filter service HITL endpoints to write both fields:

```typescript
// In filter/src/hitl/hitl.ts
// approveAction and rejectAction receive operatorId from the session

await db.query(`
  UPDATE filter_log SET
    status = $1,
    reviewed_at = now(),
    reviewed_by = $2,           -- handle string (existing)
    reviewed_by_operator_id = $3  -- UUID FK (new)
  WHERE id = $4
`, [newStatus, operator.handle, operator.id, logId]);
```

---

## Dashboard Auth Implementation

### New files

```
layers/dashboard/src/
├── app/
│   ├── login/
│   │   └── page.tsx          ← MODIFY: replace stub with real login form
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts    ← NEW: POST /api/auth/login
│       │   ├── logout/route.ts   ← NEW: POST /api/auth/logout
│       │   └── me/route.ts       ← NEW: GET /api/auth/me
│       └── admin/
│           └── operators/
│               └── route.ts      ← NEW: GET/POST /api/admin/operators (admin only)
├── lib/
│   ├── auth.ts               ← NEW: session validation, operator lookup
│   └── db.ts                 ← MODIFY: add operator + session queries
└── middleware.ts              ← MODIFY: replace mc_auth check with session check
```

### `layers/dashboard/src/lib/auth.ts`

Core auth utilities:

```typescript
import { db } from './db';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'xnoria_session';
const SESSION_TTL_HOURS = 8;
const BCRYPT_COST = 12;

export interface AuthOperator {
  id: string;
  handle: string;
  display_name: string;
  role: 'admin' | 'operator' | 'viewer';
}

export async function createSession(operatorId: string, meta: { userAgent?: string; ip?: string }): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const tokenHash = await bcrypt.hash(token, BCRYPT_COST);

  await db.query(`
    INSERT INTO operator_sessions (operator_id, token_hash, user_agent, ip_address, expires_at)
    VALUES ($1, $2, $3, $4, now() + INTERVAL '${SESSION_TTL_HOURS} hours')
  `, [operatorId, tokenHash, meta.userAgent, meta.ip]);

  return token;
}

export async function validateSession(): Promise<AuthOperator | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  // Check all non-expired sessions — compare token against each hash
  // Note: bcrypt compare is O(n sessions) — acceptable at small operator count
  // At scale, switch to a lookup-by-prefix pattern
  const sessions = await db.query(`
    SELECT s.token_hash, s.id as session_id, o.id, o.handle, o.display_name, o.role
    FROM operator_sessions s
    JOIN operators o ON o.id = s.operator_id
    WHERE s.expires_at > now()
      AND o.disabled = false
  `);

  for (const session of sessions.rows) {
    const match = await bcrypt.compare(token, session.token_hash);
    if (match) {
      // Update last_seen_at
      await db.query(
        'UPDATE operator_sessions SET last_seen_at = now() WHERE id = $1',
        [session.session_id]
      );
      return {
        id: session.id,
        handle: session.handle,
        display_name: session.display_name,
        role: session.role,
      };
    }
  }

  return null;
}

export async function invalidateSession(): Promise<void> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return;

  const sessions = await db.query(
    'SELECT id, token_hash FROM operator_sessions WHERE expires_at > now()'
  );

  for (const session of sessions.rows) {
    const match = await bcrypt.compare(token, session.token_hash);
    if (match) {
      await db.query('DELETE FROM operator_sessions WHERE id = $1', [session.id]);
      break;
    }
  }
}
```

**Performance note:** The bcrypt compare loop is acceptable at 1–5 operators. At 20+ operators or high request volume, replace with a token prefix index pattern (store first 8 chars of token in a separate indexed column for fast lookup before bcrypt comparison). Document this as a Phase 5 scaling concern.

### `layers/dashboard/src/middleware.ts`

Replace the current `mc_auth` cookie check:

```typescript
import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/api/auth/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check session cookie exists (full validation in API routes and pages)
  const sessionToken = request.cookies.get('xnoria_session');
  if (!sessionToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

Full session validation (bcrypt comparison) happens in API routes and page server components — not in middleware, because bcrypt is too slow for edge runtime.

### `POST /api/auth/login`

```typescript
// layers/dashboard/src/app/api/auth/login/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSession } from '@/lib/auth';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  const { handle, password } = await request.json();

  if (!handle || !password) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
  }

  // Fetch operator
  const result = await db.query(
    'SELECT * FROM operators WHERE handle = $1 AND disabled = false',
    [handle]
  );

  const operator = result.rows[0];

  // Brute force check
  if (operator?.locked_until && new Date(operator.locked_until) > new Date()) {
    return NextResponse.json({ error: 'Account temporarily locked' }, { status: 423 });
  }

  // Validate password
  const valid = operator?.password_hash
    ? await bcrypt.compare(password, operator.password_hash)
    : false;

  if (!valid) {
    // Increment failed attempts
    if (operator) {
      const attempts = (operator.failed_attempts || 0) + 1;
      const lockedUntil = attempts >= 3 ? new Date(Date.now() + 30 * 60 * 1000) : null;
      await db.query(
        'UPDATE operators SET failed_attempts = $1, locked_until = $2 WHERE id = $3',
        [attempts, lockedUntil, operator.id]
      );
    }
    // Same error message whether user exists or not — prevents enumeration
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  // Reset failed attempts on success
  await db.query(
    'UPDATE operators SET failed_attempts = 0, locked_until = null, last_login_at = now() WHERE id = $1',
    [operator.id]
  );

  // Create session
  const token = await createSession(operator.id, {
    userAgent: request.headers.get('user-agent') ?? undefined,
    ip: request.headers.get('x-forwarded-for') ?? undefined,
  });

  const response = NextResponse.json({
    operator: { handle: operator.handle, display_name: operator.display_name, role: operator.role }
  });

  response.cookies.set('xnoria_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 8 * 60 * 60, // 8 hours
    path: '/',
  });

  return response;
}
```

### Login page

Replace the current stub login page with a minimal form — handle + password inputs, submit calls `POST /api/auth/login`, redirects to `/` on success. Use existing TenacitOS design tokens. No password reset flow in C4 — that's a Phase 5 concern. Document a manual reset procedure in `AGENTS.md` (admin resets via direct Postgres update).

### Operator management (admin only)

`GET /api/admin/operators` — list all operators (admin role required)
`POST /api/admin/operators` — create new operator with temporary password (admin role required)

Role check pattern for admin-only routes:

```typescript
const operator = await validateSession();
if (!operator) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
if (operator.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
```

No operator management UI page in C4 — API endpoints only. Operators are created via `curl` or a simple admin script until Phase 5 builds the client onboarding UI. Document the creation procedure in `AGENTS.md`.

---

## Admin Setup After Migration

After applying migrations 012, set the admin password:

```bash
# Generate bcrypt hash for initial password
docker exec exnoria_dashboard node -e "
  const bcrypt = require('bcrypt');
  bcrypt.hash('your-initial-password', 12).then(h => console.log(h));
"

# Set the hash
docker exec exnoria_postgres psql -U postgres -d exnoria -c \
  "UPDATE operators SET password_hash = '<hash>' WHERE handle = 'admin';"
```

Document this procedure in `AGENTS.md`. The initial password must be changed on first login — add a `password_changed` boolean column to operators and redirect to a change-password page if false. This is a security requirement, not a UX nicety.

---

## Session Pruning

Add a scheduled n8n workflow `WF_SessionPrune` that runs nightly:

```sql
DELETE FROM operator_sessions WHERE expires_at < now() - INTERVAL '1 day';
```

Register in `workflows/n8n/` as `wf.sessions.prune.json`. This is infrastructure, not a CX engine workflow — it has no `filter_action` entry.

---

## Database Migrations

### `012_operators_credentials.sql`

```sql
-- Password and session fields for operators
ALTER TABLE operators
  ADD COLUMN IF NOT EXISTS password_hash    TEXT,
  ADD COLUMN IF NOT EXISTS last_login_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failed_attempts  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS password_changed BOOLEAN NOT NULL DEFAULT false;

-- Session table
CREATE TABLE IF NOT EXISTS operator_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id  UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  token_hash   TEXT NOT NULL UNIQUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '8 hours',
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_agent   TEXT,
  ip_address   TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_token_hash  ON operator_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_operator_id ON operator_sessions(operator_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at  ON operator_sessions(expires_at);

-- Link filter_log HITL reviews to operator records
ALTER TABLE filter_log
  ADD COLUMN IF NOT EXISTS reviewed_by_operator_id UUID REFERENCES operators(id);
```

### Dependencies

Migration 012 depends on migration 011 (operators table). Verify 011 was applied before running 012:

```bash
docker exec exnoria_postgres psql -U postgres -d exnoria -c \
  "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'operators');"
# Must return: t
```

---

## New and Modified Files

### New Files

| # | File | Purpose |
|---|---|---|
| 1 | `filter/db/migrations/012_operators_credentials.sql` | Password, session, filter_log FK |
| 2 | `dashboard/src/lib/auth.ts` | Session creation, validation, invalidation |
| 3 | `dashboard/src/app/api/auth/login/route.ts` | Login endpoint |
| 4 | `dashboard/src/app/api/auth/logout/route.ts` | Logout endpoint |
| 5 | `dashboard/src/app/api/auth/me/route.ts` | Current operator info |
| 6 | `dashboard/src/app/api/admin/operators/route.ts` | Operator management (admin only) |
| 7 | `workflows/n8n/wf.sessions.prune.json` | Nightly session cleanup workflow |

### Modified Files

| # | File | Change |
|---|---|---|
| 1 | `filter/db/migrations/012_...` | Add `reviewed_by_operator_id` FK |
| 2 | `filter/src/hitl/hitl.ts` | Write `reviewed_by_operator_id` on approve/reject |
| 3 | `dashboard/src/middleware.ts` | Replace `mc_auth` check with `xnoria_session` check |
| 4 | `dashboard/src/app/login/page.tsx` | Replace stub with real login form |
| 5 | `dashboard/src/lib/db.ts` | Add operator + session query helpers |

---

## Implementation Sequence

```
1. Apply migration 012
2. Set admin password hash (see Admin Setup section)
3. Implement lib/auth.ts (session utilities)
4. Implement POST /api/auth/login
5. Implement POST /api/auth/logout
6. Implement GET /api/auth/me
7. Update middleware.ts — replace mc_auth with xnoria_session
8. Update login/page.tsx — real form
9. Verify: login with admin credentials → session cookie set → dashboard accessible
10. Verify: session expiry — wait 8h or manually expire in DB → redirect to login
11. Verify: brute force — 3 wrong passwords → account locked
12. Update filter/src/hitl/hitl.ts — write reviewed_by_operator_id
13. Verify: approve HITL action → filter_log has reviewed_by_operator_id set
14. Implement GET/POST /api/admin/operators (admin role check)
15. Build and register wf.sessions.prune.json in n8n
16. Add bcrypt to dashboard package.json dependencies
17. TypeScript compilation verification
18. Update AGENTS.md
```

---

## AGENTS.md Updates

Add to Key Implementation Details:

```markdown
### Authentication

- Session cookie: `xnoria_session` (HttpOnly, Secure, SameSite=Strict, 8h TTL)
- Password hashing: bcrypt cost factor 12
- Brute force: 3 failed attempts → 30 min lockout
- Roles: admin (full access), operator (no operator management), viewer (Phase 5 — read-only)

### Creating a new operator (CLI procedure)

```bash
# Generate password hash
docker exec exnoria_dashboard node -e \
  "require('bcrypt').hash('password', 12).then(h => console.log(h))"

# Insert operator
docker exec exnoria_postgres psql -U postgres -d exnoria -c \
  "INSERT INTO operators (handle, display_name, role, password_hash)
   VALUES ('handle', 'Display Name', 'operator', '<hash>');"
```

### Resetting a password (manual procedure)

```bash
docker exec exnoria_postgres psql -U postgres -d exnoria -c \
  "UPDATE operators SET password_hash = '<new_hash>', password_changed = false
   WHERE handle = 'handle';"
```
```

---

## Acceptance Criteria

- [ ] Migration 012 applied — `operator_sessions` table exists, `operators` has password columns
- [ ] Admin password set and login works — session cookie issued on success
- [ ] Dashboard redirects to `/login` when no valid session exists
- [ ] Session expires after 8 hours of inactivity — verified by manual DB expiry test
- [ ] Three failed logins lock the account for 30 minutes
- [ ] HITL approval writes `reviewed_by_operator_id` to `filter_log`
- [ ] `POST /api/admin/operators` returns 403 for non-admin operator
- [ ] `password_changed = false` on first login redirects to change-password flow
- [ ] Session prune workflow registered in n8n and activated
- [ ] Old `mc_auth` cookie no longer grants access — verified by sending old cookie
- [ ] TypeScript compilation passes with no errors

---

## What C4 Does Not Build

These are explicitly Phase 5 concerns:

- Per-client data isolation — viewer role exists but sees full data until Phase 5 scopes the filtering
- Password reset via email — manual procedure only until Phase 5
- OAuth / SSO — username + password is sufficient for the current operator count
- Operator management UI page — API endpoints only, CLI procedure for now
- Audit log of operator actions beyond HITL reviews — Phase 5 compliance scope