-- 022: Standardize acq.lead.score n8n_workflow_id
-- Multiple migrations (010, 011, 018) and the seed conflicting on the value.
-- The actual n8n webhook is registered at 'xnoria-acq-lead-score-v1'.
-- This migration sets the canonical value.
UPDATE filter_action
SET n8n_workflow_id = 'xnoria-acq-lead-score-v1', updated_at = now()
WHERE action_id = 'acq.lead.score';
