-- ==============================================================================
-- Exnoria · Filter service · HITL support columns
-- Migration: 002_hitl_columns.sql
--
-- Adds columns to filter_log for tracking human review of HITL actions:
--   reviewed_at  — timestamp when operator approved/rejected
--   reviewed_by  — operator identifier (e.g. "admin")
--
-- Adds partial index for efficient HITL pending queue queries.
-- ==============================================================================

-- Add review tracking columns to filter_log
ALTER TABLE filter_log
  ADD COLUMN IF NOT EXISTS reviewed_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by   TEXT;

-- Partial index: fast lookup for pending HITL actions
-- Only indexes rows where status = 'pending_hitl', keeping the index small
CREATE INDEX IF NOT EXISTS idx_filter_log_hitl_pending
  ON filter_log (created_at DESC)
  WHERE status = 'pending_hitl';
