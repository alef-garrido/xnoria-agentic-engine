-- ==============================================================================
-- Exnoria · Filter service · Migration 019
--
-- Fixes prd.adoption.nudge workflow routing.
-- The DB has n8n_workflow_id = 'prd-adoption-nudge' (from seed.sql)
-- but the actual deployed n8n webhook path is 'prd-contact-nudge'
-- (matching the prd.contact.nudge.json workflow file).
--
-- Migration 010 set this correctly but the seed ON CONFLICT overwrote it.
-- ==============================================================================

BEGIN;

UPDATE filter_action
SET n8n_workflow_id = 'prd-contact-nudge', updated_at = now()
WHERE action_id = 'prd.adoption.nudge';

COMMIT;
