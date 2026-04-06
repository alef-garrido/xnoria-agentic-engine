-- ==============================================================================
-- Exnoria · Filter service · Initial schema
-- Migration: 001_create_filter_tables.sql
--
-- Creates:
--   filter_action  — runtime allowlist of permitted actions
--   filter_log     — immutable audit log of every action attempted
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
-- Never updated after insert.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS filter_log (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id        TEXT NOT NULL,               -- mirrors filter_action.action_id
  stage            TEXT NOT NULL,               -- mirrors filter_action.stage
  session_id       TEXT NOT NULL,               -- OpenClaw session that generated this action
  status           TEXT NOT NULL,               -- executed | rejected | pending_hitl | error
  rejection_code   TEXT,                        -- populated when status = rejected
  rejection_reason TEXT,                        -- human-readable rejection detail
  payload_in       JSONB NOT NULL DEFAULT '{}', -- what the cognitive layer sent
  payload_out      JSONB DEFAULT '{}',          -- what n8n returned (if executed)
  meta             JSONB DEFAULT '{}',          -- optional cognitive layer metadata
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
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
