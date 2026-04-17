# AGENTS.md — Dashboard

**Location:** `layers/dashboard/`
**Role:** Execution layer — signals visualization, reporting, HITL interface

## Tech Stack
- **Framework:** Next.js 16 + React 19
- **Styling:** Tailwind CSS v4
- **Charts:** Recharts
- **Icons:** Lucide React
- **Database:** Postgres (via pg pool)
- **Auth:** Session-based (`xnoria_session` cookie, bcrypt, Postgres-backed)

## Commands
```bash
npm run dev     # next dev -H 0.0.0.0
npm run build   # next build
npm run start   # next start -H 0.0.0.0
npm run lint    # eslint
```

## Directory Structure
```
src/
├── app/
│   ├── (dashboard)/      # Dashboard pages (route group)
│   │   ├── page.tsx      # Dashboard home
│   │   ├── hitl/         # HITL approval queue
│   │   └── allowlist/    # Allowlist manager
│   ├── api/              # API routes (proxy to filter, etc.)
│   │   └── filter/       # Filter service proxy routes
│   │       ├── hitl/     # HITL queue + approve/reject
│   │       └── allowlist/ # Allowlist CRUD
│   └── login/            # Auth pages
├── components/           # UI components
│   ├── TenacitOS/        # Shared design system components
│   ├── HITLQueue.tsx     # Polling HITL queue component
│   ├── AllowlistManager.tsx # Allowlist table with toggles + modals
│   └── Sidebar.tsx       # Navigation with HITL + Allowlist links
├── config/               # Configuration files
├── hooks/                # React hooks
├── lib/
│   ├── auth.ts           # Session creation, validation, invalidation
│   └── db.ts             # Postgres pool wrapper
└── proxy.ts              # Auth middleware (cookie presence check only)
data/                     # Example data files
```

## Path Aliases
- `@/*` → `./src/*` (configured in tsconfig.json)

## Auth Pattern (C4)

Session-based authentication. Cookie `xnoria_session` carries a 32-byte random token.
Only the bcrypt hash of the token is stored in `operator_sessions`. Full bcrypt comparison
happens in `lib/auth.ts` — NOT in `proxy.ts` (edge middleware can only do cookie presence check).

### Roles
| Role | Access |
|---|---|
| `admin` | Full dashboard + operator management |
| `operator` | Full dashboard, no `/api/admin/*` |
| `viewer` | Phase 5 — defined in schema, full access until isolation is scoped |

### Creating a new operator (CLI)
```bash
# 1. Generate bcrypt hash for the temporary password
docker exec exnoria_dashboard node -e \
  "require('bcrypt').hash('temp-password', 12).then(h => console.log(h))"

# 2. Insert operator row
docker exec exnoria_postgres psql -U postgres -d exnoria -c \
  "INSERT INTO operators (handle, display_name, role, password_hash) \
   VALUES ('alice', 'Alice Smith', 'operator', '<hash from step 1>');"
```

### Resetting a password (manual procedure)
```bash
# 1. Generate new hash
docker exec exnoria_dashboard node -e \
  "require('bcrypt').hash('new-password', 12).then(h => console.log(h))"

# 2. Update operator and force a password change on next login
docker exec exnoria_postgres psql -U postgres -d exnoria -c \
  "UPDATE operators \
   SET password_hash = '<new_hash>', password_changed = false \
   WHERE handle = 'alice';"
```

### Setting the admin password after migration 012
```bash
docker exec exnoria_dashboard node -e \
  "require('bcrypt').hash('your-secure-password', 12).then(h => console.log(h))"

docker exec exnoria_postgres psql -U postgres -d exnoria -c \
  "UPDATE operators SET password_hash = '<hash>', password_changed = true \
   WHERE handle = 'admin';"
```

### Creating an operator via API (admin only)
```bash
curl -X POST http://localhost:4000/api/admin/operators \
  -H "Content-Type: application/json" \
  -H "Cookie: xnoria_session=<your-token>" \
  -d '{"handle":"alice","display_name":"Alice","role":"operator","password":"temp1234"}'
```

## Database Access
- Direct Postgres connection via `src/lib/db.ts` (pg pool wrapper)
- Used for reading filter logs, cognitive sessions, HITL queue
- Never write directly to filter_action table — use filter API instead

## Adding a New Dashboard Page
1. Create page at `src/app/(dashboard)/your-page/page.tsx`
2. Create API proxy route if needed: `src/app/api/your-api/route.ts`
3. Use existing TenacitOS components from `src/components/TenacitOS/`
4. Follow existing auth pattern (protect with proxy.ts middleware)

## Adding an API Route
1. Create route at `src/app/api/your-endpoint/route.ts`
2. Use Next.js App Router API conventions
3. Proxy to filter service when needed (don't duplicate filter logic)
4. Include auth check via proxy.ts pattern

## Component Conventions
- Use TenacitOS design system components when available
- Server components by default, use `'use client'` only when needed
- Follow existing patterns for data fetching and state management
- Use Recharts for data visualization
- Use Lucide React for icons
- Use date-fns for date formatting

## Domain Language
| Term | Meaning |
|---|---|
| **Signal** | A structured business event (new lead, support ticket, churn indicator) |
| **Action** | A single permitted operation, identified as `stage.resource.verb` |
| **Stage** | Customer journey phase: ACQ, SAL, ONB, PRD, SUP, COM, RET, EXP |
| **Session** | One reasoning cycle from the cognitive layer |
| **HITL** | Human-in-the-loop — action requiring human approval |
| **Audit log** | Immutable record of every action attempted |

## Critical Rules
1. **The dashboard reads — it doesn't execute.** All action execution goes through the filter API.
2. **Use proxy routes** to communicate with the filter service, don't call filter DB directly for writes.
3. **Follow existing auth patterns** — all dashboard routes should be protected.
4. **Use TenacitOS components** for consistency.

## Key Pages (Phase 3 A3 Complete)
- **Dashboard home** — overview of signals, actions, system health
- **HITL queue** (`/hitl`) — `HITLQueue` component, 10s polling, approve/reject buttons, empty state
- **Allowlist manager** (`/allowlist`) — `AllowlistManager` component, table with toggle switches for `enabled`/`requires_hitl`, Add modal, delete confirm
- **Journey health map** (`/health`) — CX health per stage with metrics dashboard

### Sidebar Navigation
`Sidebar.tsx` includes nav items:
- ⚡ **Approvals** (`/hitl`) — `ShieldCheck` icon
- ☑ **Allowlist** (`/allowlist`) — `ListChecks` icon
- 📊 **Health** (`/health`) — `Activity` icon (Phase 2)

## Environment Variables
| Variable | Description |
|---|---|
| `DASHBOARD_PORT` | Dashboard port (default: 4000) |
| `FILTER_URL` | Filter service URL (default: `http://filter:3000` in compose) |
| `POSTGRES_*` | Database connection (inherited from docker-compose) |
| `COM_CONTENT_SHEET_ID` | Google Sheets ID for content calendar (COM workflow) |

## Auth Notes for Agents
- `proxy.ts` only checks cookie *presence* — it cannot do bcrypt in edge runtime
- Full session validation: always call `validateSession()` from `lib/auth.ts` in API routes/pages
- Use `requireAuth()` for operator check, `requireAdmin()` for admin-only routes
- `reviewed_by_operator_id` (UUID FK) must be written alongside `reviewed_by` (string) on HITL actions
- Session cookie name is the constant `SESSION_COOKIE` exported from `lib/auth.ts` — never hardcode `'xnoria_session'`
- `password_changed = false` on first login must redirect to `/change-password` (page not yet built — Phase 5; login API signals it via `requires_password_change: true`)
