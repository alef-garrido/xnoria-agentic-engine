# AGENTS.md — Dashboard

**Location:** `layers/dashboard/`
**Role:** Execution layer — signals visualization, reporting, HITL interface

## Tech Stack

- **Framework:** Next.js 16 + React 19
- **Styling:** Tailwind CSS v4
- **Charts:** Recharts
- **Icons:** Lucide React
- **Database:** Postgres (via pg pool)
- **Logging:** Structured logging with pino (server) and console wrapper (client)
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
│   │   ├── tools/        # CX Tools section
│   │   │   ├── page.tsx  # CX Tools launcher (card grid)
│   │   │   ├── layout.tsx # Section strip with breadcrumb
│   │   │   ├── compass/  # Compass tool route
│   │   │   ├── radar/    # Radar tool route
│   │   │   ├── matriz/   # Matriz tool route
│   │   │   └── editor/   # Editor tool route
│   │   ├── compass/ radar/ matriz/ editor/  # Redirect stubs → /tools/*
│   │   ├── hitl/         # HITL approval queue
│   │   └── allowlist/    # Allowlist manager
│   ├── api/              # API routes (proxy to filter, etc.)
│   │   └── filter/       # Filter service proxy routes
│   │       ├── hitl/     # HITL queue + approve/reject
│   │       └── allowlist/ # Allowlist CRUD
│   └── login/            # Auth pages
├── features/
│   └── cx-tools/         # Merged CX decision-support tools (self-contained)
│       ├── shared/       # Shared domain/data/theme/types (radar engine, wheel, registry)
│       ├── compass/      # Compass wheel (components, context, theme, utils)
│       ├── radar/        # Radar signal explorer (cx-radar + signals components)
│       ├── matriz/       # Impact/effort matrix
│       └── editor/       # Wheel editor (has its own scoped ui/ button+input primitives)
├── components/           # UI components
│   ├── TenacitOS/        # Shared design system components (TopBar, StatusBar)
│   ├── ui/               # Primitives: Card, PageHeader, Skeleton, ToggleSwitch, Badge, Button, Input... (legacy .btn-*/.input/.badge classes removed — use these)
│   ├── hitl/             # HITL queue subcomponents (PendingActionCard, PayloadEditor, ActionButtons)
│   ├── allowlist/        # Allowlist subcomponents (ActionRow, AddActionModal)
│   ├── sessions/         # Sessions subcomponents (SessionRow)
│   ├── HITLQueue.tsx     # HITL queue container (data + state, delegates rendering)
│   ├── AllowlistManager.tsx # Allowlist container (data + state, delegates rendering)
│   ├── ActivityFeed.tsx  # Polling activity feed
│   ├── ToastProvider.tsx # Global toast context (useToast)
│   └── Sidebar.tsx       # Navigation with HITL + Allowlist links
├── config/               # Configuration files
├── hooks/                # React hooks (usePolling — shared data-fetching hook)
├── lib/
│   ├── auth.ts           # Session creation, validation, inactivation
│   ├── db.ts             # Postgres pool wrapper
│   ├── constants.ts      # STAGES, ACTIVE_STAGES, JourneyStage, TOAST_DURATION_MS (single source of truth)
│   ├── healthStatus.ts   # Journey health derivation logic (pure, unit-testable)
│   ├── pagination.ts     # parsePagination + paginate — shared list/pagination envelope
│   ├── service-client.ts # filterFetch / memoryFetch — server proxy to filter & memory services
│   ├── client-api.ts     # apiFetch + ApiError — typed client fetch wrapper
│   ├── docker.ts         # Docker Engine API client + project service lookup helpers
│   ├── logger.ts         # Server-side structured logger (pino)
│   └── client-logger.ts  # Client-side structured logger wrapper
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

| Role       | Access                                                             |
| ---------- | ------------------------------------------------------------------ |
| `admin`    | Full dashboard + operator management                               |
| `operator` | Full dashboard, no `/api/admin/*`                                  |
| `viewer`   | Phase 5 — defined in schema, full access until isolation is scoped |

## Admin Password Bootstrap

The admin account is created by migration 012 with `password_hash = NULL`. Two mechanisms
allow you to set the password:

### Path 1: Automatic (Docker Startup + Environment Variable)

**Recommended for fresh deployments.**

If `DASHBOARD_ADMIN_PASSWORD` is set in `.env` before `make up`, the admin password is
automatically seeded when the dashboard container starts:

```bash
# .env
DASHBOARD_ADMIN_PASSWORD=your-secure-password-here

# Run initialization
./deploy/init.sh

# ... migrations run ...
# ... "DASHBOARD_ADMIN_PASSWORD is set"...
# ... Stack starts ...
# ... Dashboard container runs: node scripts/init-admin-password.js ...
# ... "[admin-init] Admin password initialized successfully" ...
```

How it works:

1. `.env` is sourced with `DASHBOARD_ADMIN_PASSWORD` set
2. Migrations run (migration 014 verifies admin exists)
3. Stack starts (full services including dashboard)
4. Dashboard container entrypoint runs: `node scripts/init-admin-password.js`
5. Script checks if admin `password_hash IS NULL`
6. If NULL, hashes password with bcrypt and updates the row
7. Logs success: "[admin-init] Admin password initialized successfully"
8. Dashboard service (`npm start`) begins normally

**Idempotent:** Running `./deploy/init.sh` multiple times is safe — the script only
updates the password if it's currently `NULL`. Restarting the dashboard container is also safe.

### Path 2: Manual Bootstrap API (Escape Hatch)

**Use this if the password was not seeded** (e.g., env var was added after migrations).

Call `POST /api/bootstrap/admin-init` once during setup:

```bash
# Endpoint is public — no auth required
curl -X POST http://localhost:4000/api/bootstrap/admin-init \
  -H "Content-Type: application/json" \
  -d '{"password": "your-secure-password-here"}'

# Response (200 OK):
# {
#   "message": "Admin password initialized successfully",
#   "admin": {
#     "id": "<uuid>",
#     "handle": "admin",
#     "display_name": "System Admin"
#   }
# }
```

**Self-disabling:** After the first successful call, the endpoint returns 403 Forbidden
for all subsequent calls with message: "Admin already initialized. This endpoint can
only be used once during setup."

Error responses:

- `400 Bad Request` — password too short (minimum 8 characters) or invalid JSON
- `403 Forbidden` — admin already initialized or not found (dependency failure)
- `500 Internal Server Error` — database error

### Path 3: Fallback (CLI + Manual bcrypt)

**Last resort if automated paths fail.**

```bash
# 1. Generate bcrypt hash for your password
docker exec exnoria_dashboard node -e \
  "require('bcrypt').hash('your-secure-password', 12).then(h => console.log(h))"

# 2. Copy the output hash and use it in the UPDATE:
docker exec exnoria_postgres psql -U xnoria -d exnoria -c \
  "UPDATE operators SET password_hash = '<paste-hash-here>', password_changed = true WHERE handle = 'admin';"
```

### Creating additional operators (via API, admin only)

```bash
curl -X POST http://localhost:4000/api/admin/operators \
  -H "Content-Type: application/json" \
  -H "Cookie: xnoria_session=<your-token>" \
  -d '{"handle":"alice","display_name":"Alice","role":"operator","password":"temp1234"}'
```

### Resetting a password (manual procedure)

```bash
# 1. Generate new hash
docker exec exnoria_dashboard node -e \
  "require('bcrypt').hash('new-password', 12).then(h => console.log(h))"

# 2. Update operator and force a password change on next login
docker exec exnoria_postgres psql -U xnoria -d exnoria -c \
  "UPDATE operators \
   SET password_hash = '<new_hash>', password_changed = false \
   WHERE handle = 'alice';"
```

### Creating an operator via CLI (alternative to POST)

## Database Access

- Direct Postgres connection via `src/lib/db.ts` (pg pool wrapper)
- Used for reading filter logs, cognitive sessions, HITL queue
- Never write directly to filter_action table — use filter API instead

## Adding a New Dashboard Page

1. Create page at `src/app/(dashboard)/your-page/page.tsx`
2. Create API proxy route if needed: `src/app/api/your-api/route.ts`
3. Use UI primitives from `src/components/ui/` and `usePolling` for data fetching (see Component Conventions)
4. Follow existing auth pattern (protect with proxy.ts middleware)

## Adding a New CX Tool

1. Create tool feature at `src/features/cx-tools/<tool>/` (components + lib)
2. Add route at `src/app/(dashboard)/tools/<tool>/page.tsx` (thin wrapper importing the feature page component)
3. Add entry to `navSections` CX Tools group in `src/components/Sidebar.tsx`
4. Add card to the launcher at `src/app/(dashboard)/tools/page.tsx`
5. Put truly shared code in `src/features/cx-tools/shared/` (domain, wheel data/types, theme tokens, translations, pdf) — never import from another tool's private dir
6. Old flat routes (`/compass`, `/radar`, `/matriz`, `/editor`) must remain as redirect stubs → `/tools/<tool>`

## Adding an API Route

1. Create route at `src/app/api/your-endpoint/route.ts`
2. Use Next.js App Router API conventions
3. Proxy to filter service when needed (don't duplicate filter logic)
4. Include auth check via proxy.ts pattern

## Component Conventions

- Server components by default, use `'use client'` only when needed
- Use UI primitives from `src/components/ui/` (Card, PageHeader, Skeleton, Badge, Button, Input) instead of repeating the card/header/badge/button/input markup
  - `ui/Input` is for `<input>`; for `<select>`/`<textarea>` use the exported `inputClass` from `ui/Input` (shared styling)
  - `ui/Button` variants: `primary` | `outline` | `danger` (matches the retired `.btn-*` design); pass size overrides via `className` (`text-[12px]`, etc.)
- Data fetching and polling: use `usePolling` from `src/hooks/usePolling.ts` — never hand-roll `useEffect + setInterval + mirror-ref`
  - Pass a stable fetcher (wrap in `useCallback` when it depends on state, e.g. the `days` selector)
  - Default behavior keeps stale data on fetch errors; pass `keepStaleOnError: false` to override
  - Use `setData` for optimistic updates (toggles, removals, appends)
- All client fetches go through `apiFetch` from `src/lib/client-api.ts` — never raw `fetch`
  - `apiFetch<T>(path, { method, body })` — typed, JSON body, throws `ApiError` (`.status`, `.data`, `.message` from `details.message` → `error` → `HTTP <status>`)
  - `ApiError.status === 0` means a transport/network failure; call sites keep their existing try/catch + toast patterns
- Server-side API routes:
  - Proxy to the filter service via `filterFetch` / `memoryFetch` from `src/lib/service-client.ts` — never hand-roll `fetch` + 502 mapping
  - Paginated list endpoints use `parsePagination` + `paginate` from `src/lib/pagination.ts`
  - Container status lookups use `listProjectServiceNames` / `findContainer` from `src/lib/docker.ts`
- Toasts: use `useToast()` from `src/components/ToastProvider.tsx` (provider is mounted in the dashboard layout) — never re-implement toast state
- Stage knowledge: import `STAGES` / `ACTIVE_STAGES` / `JourneyStage` from `src/lib/constants.ts` — never hardcode stage lists
- Journey health status logic lives in `src/lib/healthStatus.ts` (pure functions) — keep derivation out of components
- Prefer Tailwind utility classes and CSS variables (`text-[var(--text-secondary)]`, `bg-[var(--card)]`); avoid inline `style={{}}` for static styling
- Use CSS hover classes (`hover:bg-...`) instead of `onMouseEnter/onMouseLeave` DOM mutation
- Use Recharts for data visualization
- Use Lucide React for icons
- Use date-fns for date formatting
- Components that fetch + render a large list delegate row/panel rendering to extracted subcomponents (see `components/hitl/`, `components/allowlist/`, `components/sessions/`)
- Tooling: `npm run typecheck` (tsc --noEmit), `npm run lint`, `npm run format` (Prettier), `npm run test` (Vitest)

## Verification Gate (every change)

```bash
npm run build && npm run lint && npm run test && npm run typecheck
```

## Logging Patterns

All logging in the dashboard follows a structured approach using dedicated logger modules:

### Server-Side Logging (`src/lib/logger.ts`)

- Uses `pino` for structured JSON logging in production
- Pretty formatted logs in development with `pino-pretty`
- Automatically handles log levels based on `NODE_ENV`
- Includes serializers for request/response/error objects

**Usage in API routes:**

```typescript
import { logger } from "@/lib/logger";

try {
  // ... some operation
} catch (error) {
  logger.error({ error, additionalContext: "value" }, "Descriptive error message");
}
```

### Client-Side Logging (`src/lib/client-logger.ts`)

- Safe console wrapper for React client components
- Structured formatting with log levels
- Automatically suppresses DEBUG logs in production
- Same interface as server logger for consistency

**Usage in client components:**

```typescript
import { clientLogger } from "@/lib/client-logger";

try {
  // ... some operation
} catch (error) {
  clientLogger.error("Descriptive error message", { error, additionalContext: "value" });
}
```

### Key Principles

1. **No direct `console.*` calls** - always use appropriate logger
2. **Structured data** - pass objects as first parameter for correlation
3. **Descriptive messages** - clear, actionable log content
4. **Context aware** - include relevant IDs and metadata
5. **Level appropriate** - use debug/info/warn/error correctly

## Domain Language

| Term          | Meaning                                                                 |
| ------------- | ----------------------------------------------------------------------- |
| **Signal**    | A structured business event (new lead, support ticket, churn indicator) |
| **Action**    | A single permitted operation, identified as `stage.resource.verb`       |
| **Stage**     | Customer journey phase: ACQ, SAL, ONB, PRD, SUP, COM, RET, EXP          |
| **Session**   | One reasoning cycle from the cognitive layer                            |
| **HITL**      | Human-in-the-loop — action requiring human approval                     |
| **Audit log** | Immutable record of every action attempted                              |

## Critical Rules

1. **The dashboard reads — it doesn't execute.** All action execution goes through the filter API.
2. **Use proxy routes** to communicate with the filter service, don't call filter DB directly for writes.
3. **Follow existing auth patterns** — all dashboard routes should be protected.
4. **Use UI primitives and shared hooks** (`components/ui/`, `usePolling`, `useToast`) for consistency — see Component Conventions.

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

| Variable               | Description                                                   |
| ---------------------- | ------------------------------------------------------------- |
| `DASHBOARD_PORT`       | Dashboard port (default: 4000)                                |
| `FILTER_URL`           | Filter service URL (default: `http://filter:3000` in compose) |
| `POSTGRES_*`           | Database connection (inherited from docker-compose)           |
| `COM_CONTENT_SHEET_ID` | Google Sheets ID for content calendar (COM workflow)          |

## Auth Notes for Agents

- `proxy.ts` only checks cookie _presence_ — it cannot do bcrypt in edge runtime
- Full session validation: always call `validateSession()` from `lib/auth.ts` in API routes/pages
- Use `requireAuth()` for operator check, `requireAdmin()` for admin-only routes
- `reviewed_by_operator_id` (UUID FK) must be written alongside `reviewed_by` (string) on HITL actions
- Session cookie name is the constant `SESSION_COOKIE` exported from `lib/auth.ts` — never hardcode `'xnoria_session'`
- `password_changed = false` on first login must redirect to `/change-password` (page not yet built — Phase 5; login API signals it via `requires_password_change: true`)
