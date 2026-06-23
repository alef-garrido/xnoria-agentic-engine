-- ==============================================================================
-- Exnoria · Filter service · HITL payload override support
-- Migration: 015_hitl_payload_override.sql
--
-- Adds payload_reviewed column to filter_log. When an operator edits the
-- message before approving a HITL action, the modified payload is stored
-- here. The original AI-proposed payload stays in payload_in for analytics.
--
-- This enables:
--   1. Operator edits outreach messages before sending
--   2. Tracking what the AI proposed vs what the human actually sent
--   3. Future prompt tuning based on human corrections
-- ==============================================================================

ALTER TABLE filter_log
  ADD COLUMN IF NOT EXISTS payload_reviewed JSONB;

-- Comment for documentation
COMMENT ON COLUMN filter_log.payload_reviewed IS
  'Operator-edited payload used for dispatch. NULL = payload_in was used as-is.';
