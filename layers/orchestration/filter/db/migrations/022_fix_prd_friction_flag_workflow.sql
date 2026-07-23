-- ==============================================================================
-- Exnoria · Filter · Migration 022
-- Fix prd.friction.flag n8n_workflow_id (was PLACEHOLDER_WEBHOOK_PRD_01)
-- Now points to the same prd-contact-nudge workflow as prd.adoption.nudge
-- This enables the prd_friction_flag tool to dispatch successfully
-- ==============================================================================

UPDATE filter_action
SET n8n_workflow_id = 'prd-contact-nudge',
    updated_at      = now()
WHERE action_id = 'prd.friction.flag';
