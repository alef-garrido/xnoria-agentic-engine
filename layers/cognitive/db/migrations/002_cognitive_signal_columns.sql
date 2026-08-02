-- ==============================================================================
-- Exnoria · Cognitive layer · Signal columns
-- Migration: 002_cognitive_signal_columns.sql
--
-- Extends cognitive_session with Compass signal metadata so the dashboard
-- radar can surface live per-contact signal detection (Phase 2).
--
-- Idempotent: safe to run on every deploy/init.sh.
-- ==============================================================================

ALTER TABLE cognitive_session ADD COLUMN IF NOT EXISTS signal_id TEXT;
ALTER TABLE cognitive_session ADD COLUMN IF NOT EXISTS signal_severity DOUBLE PRECISION;
ALTER TABLE cognitive_session ADD COLUMN IF NOT EXISTS cause_code TEXT;

-- Support "latest signal per contact" and per-signal drill-down
CREATE INDEX IF NOT EXISTS idx_cognitive_session_signal_created
  ON cognitive_session (signal_id, created_at DESC);
