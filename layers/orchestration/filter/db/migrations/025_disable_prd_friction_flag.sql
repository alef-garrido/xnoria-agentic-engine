-- ==============================================================================
-- Exnoria · Filter service · Migration 025
--
-- Disables prd.friction.flag.
--
-- This action was enabled in migration 007 but was never fully wired:
--   - No tool definition in cognitive layer (LLM cannot call it)
--   - No seed registration (not managed via config/seeds/)
--   - Only a 581-byte placeholder workflow (workflows/n8n/placeholder_prd.friction.flag.json)
--
-- It is superseded by prd.adoption.nudge and prd.contact.educate.
-- Setting enabled=false makes the DB state honest.
-- ==============================================================================

BEGIN;

UPDATE filter_action
SET enabled = false, updated_at = now()
WHERE action_id = 'prd.friction.flag';

COMMIT;
