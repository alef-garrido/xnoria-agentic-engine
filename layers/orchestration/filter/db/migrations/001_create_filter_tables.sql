-- ==============================================================================
-- Exnoria · Filter service · Canonical schema (consolidated)
-- Migration: 001_create_filter_tables.sql
--
-- THIS IS THE CONSOLIDATED CANONICAL SCHEMA.
-- Squashes migrations 001–025 into a single DDL file.
-- Do NOT alter — add new migrations as 002_*, 003_*, etc.
--
-- Creates:
--   filter_action     — runtime allowlist of permitted actions (+ manual_action)
--   filter_log        — immutable audit log of every action attempted
--   operators         — operator identities and RBAC
--   operator_sessions — active session tracking
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- filter_action
-- Each row is one permitted action the cognitive layer can request.
-- The filter checks this table on every incoming request.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS filter_action (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id         TEXT NOT NULL UNIQUE,       -- e.g. acq.lead.score
  stage             TEXT NOT NULL,              -- ACQ | SAL | ONB | PRD | SUP | COM | RET | EXP
  n8n_workflow_id   TEXT NOT NULL,              -- n8n webhook path e.g. acq-lead-score
  requires_hitl     BOOLEAN NOT NULL DEFAULT false,
  manual_action     BOOLEAN NOT NULL DEFAULT false,
  enabled           BOOLEAN NOT NULL DEFAULT true,
  description       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for the hot path: action_id + stage lookup on every request
CREATE INDEX IF NOT EXISTS idx_filter_action_lookup
  ON filter_action (action_id, stage);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER filter_action_updated_at
  BEFORE UPDATE ON filter_action
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ------------------------------------------------------------------------------
-- filter_log
-- Immutable audit record of every action the cognitive layer attempted.
-- Written on every outcome: executed, rejected, pending_hitl, error.
-- Never updated after insert (review columns set after HITL resolution).
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS filter_log (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id               TEXT NOT NULL,               -- mirrors filter_action.action_id
  stage                   TEXT NOT NULL,               -- mirrors filter_action.stage
  session_id              TEXT NOT NULL,               -- agent session that generated this action
  status                  TEXT NOT NULL,               -- executed | rejected | pending_hitl | error
  rejection_code          TEXT,                        -- populated when status = rejected
  rejection_reason        TEXT,                        -- human-readable rejection detail
  payload_in              JSONB NOT NULL DEFAULT '{}', -- what the agent sent
  payload_out             JSONB DEFAULT '{}',          -- what n8n returned (if executed)
  payload_reviewed        JSONB,                       -- operator-edited payload (HITL override)
  reviewed_at             TIMESTAMPTZ,                 -- when operator approved/rejected
  reviewed_by             TEXT,                        -- operator identifier (e.g. "admin")
  reviewed_by_operator_id UUID,                        -- FK to operators(id)
  meta                    JSONB DEFAULT '{}',          -- optional agent metadata
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for dashboard queries and audit trail lookups
CREATE INDEX IF NOT EXISTS idx_filter_log_session
  ON filter_log (session_id);

CREATE INDEX IF NOT EXISTS idx_filter_log_action
  ON filter_log (action_id);

CREATE INDEX IF NOT EXISTS idx_filter_log_status
  ON filter_log (status);

CREATE INDEX IF NOT EXISTS idx_filter_log_created
  ON filter_log (created_at DESC);

-- Partial index: fast lookup for pending HITL actions
CREATE INDEX IF NOT EXISTS idx_filter_log_hitl_pending
  ON filter_log (created_at DESC)
  WHERE status = 'pending_hitl';

-- ------------------------------------------------------------------------------
-- operators
-- Identity and RBAC table for dashboard operators.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS operators (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handle           TEXT NOT NULL UNIQUE,
  display_name     TEXT NOT NULL,
  role             TEXT NOT NULL, -- admin, operator, viewer
  password_hash    TEXT,
  last_login_at    TIMESTAMPTZ,
  failed_attempts  INTEGER NOT NULL DEFAULT 0,
  locked_until     TIMESTAMPTZ,
  password_changed BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Default admin (password set externally via deploy/init.sh or bootstrap API)
INSERT INTO operators (handle, display_name, role)
VALUES ('admin', 'System Admin', 'admin')
ON CONFLICT (handle) DO NOTHING;

-- ------------------------------------------------------------------------------
-- operator_sessions
-- Active sessions with token hash. TTL: 8 hours sliding window.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS operator_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id  UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  token_hash   TEXT NOT NULL UNIQUE,    -- bcrypt(session_token, 12) — never the raw token
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '8 hours',
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_agent   TEXT,
  ip_address   TEXT
);

-- Hot path: token lookup on every authenticated request
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash  ON operator_sessions(token_hash);
-- HITL and admin: list sessions per operator
CREATE INDEX IF NOT EXISTS idx_sessions_operator_id ON operator_sessions(operator_id);
-- Session pruning query efficiency
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at  ON operator_sessions(expires_at);

-- ------------------------------------------------------------------------------
-- FK from filter_log.reviewed_by_operator_id to operators
-- ------------------------------------------------------------------------------
ALTER TABLE filter_log
  ADD CONSTRAINT fk_filter_log_reviewed_operator
  FOREIGN KEY (reviewed_by_operator_id) REFERENCES operators(id);
