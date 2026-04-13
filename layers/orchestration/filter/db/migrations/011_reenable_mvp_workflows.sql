-- ==============================================================================
-- Exnoria · Re-enable MVP workflows after rebuild
-- Migration: 011_reenable_mvp_workflows.sql
--
-- After rebuilding and importing the three MVP workflows in n8n,
-- replace PLACEHOLDER_WEBHOOK_ID with the actual webhook path from n8n.
-- ==============================================================================

BEGIN;

-- Re-enable acq.lead.score
UPDATE filter_action
SET n8n_workflow_id = 'xnoria-acq-lead-score-v1', enabled = true, updated_at = now()
WHERE action_id = 'acq.lead.score';

-- Re-enable sal.sequence.enroll
UPDATE filter_action
SET n8n_workflow_id = 'xnoria-sal-sequence-enroll-v1', enabled = true, updated_at = now()
WHERE action_id = 'sal.sequence.enroll';

-- Re-enable sal.contact.prioritize (requires HITL)
UPDATE filter_action
SET n8n_workflow_id = 'xnoria-sal-contact-prioritize-v1', enabled = true, updated_at = now()
WHERE action_id = 'sal.contact.prioritize';

COMMIT;