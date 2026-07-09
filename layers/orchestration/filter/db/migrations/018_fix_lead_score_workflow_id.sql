-- ==============================================================================
-- Exnoria · Filter service · Migration 018
--
-- Fixes acq.lead.score workflow routing by updating the n8n_workflow_id to
-- the actual registered webhook path structure in n8n.
-- ==============================================================================

BEGIN;

UPDATE filter_action
SET n8n_workflow_id = 'mvp-acq-lead-score-v1/webhook/xnoria-acq-lead-score-v1', updated_at = now()
WHERE action_id = 'acq.lead.score';

COMMIT;
