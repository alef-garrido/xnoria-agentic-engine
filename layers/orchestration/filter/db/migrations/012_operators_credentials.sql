-- ==============================================================================
-- Exnoria · Operators credentials + session table
-- Migration: 012_operators_credentials.sql
--
-- Depends on: 011_reenable_mvp_workflows.sql (operators table must exist)
--
-- Verify dependency before running:
--   SELECT EXISTS (
--     SELECT FROM information_schema.tables WHERE table_name = 'operators'
--   );
--   -- Must return: t
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- Password and account-security columns on operators
-- ------------------------------------------------------------------------------
ALTER TABLE operators
  ADD COLUMN IF NOT EXISTS password_hash    TEXT,
  ADD COLUMN IF NOT EXISTS last_login_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failed_attempts  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS password_changed BOOLEAN NOT NULL DEFAULT false;

-- ------------------------------------------------------------------------------
-- operator_sessions
-- Stores active sessions. Token is never stored plaintext — only bcrypt hash.
-- Session TTL: 8 hours from last_seen_at (sliding window).
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
-- Link filter_log HITL reviews to a real operator record (adds FK alongside
-- the existing reviewed_by TEXT column which stays for backward compat)
-- ------------------------------------------------------------------------------
ALTER TABLE filter_log
  ADD COLUMN IF NOT EXISTS reviewed_by_operator_id UUID REFERENCES operators(id);

COMMIT;
