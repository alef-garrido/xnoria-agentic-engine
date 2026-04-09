-- ==============================================================================
-- Exnoria · Filter service · SUP + RET action registration
-- Migration: 004_sup_ret_actions.sql
--
-- Registers four new actions for Support and Retention stages.
-- Webhook IDs are PLACEHOLDERS — they must be replaced in migration 005
-- after the real n8n workflows are built and exported.
-- ==============================================================================

INSERT INTO filter_action (action_id, stage, n8n_workflow_id, requires_hitl, enabled, description)
VALUES
  ('sup.ticket.escalate', 'SUP', 'PLACEHOLDER_WEBHOOK_ID_W4', false, true, 'Escalate ticket to senior support queue'),
  ('sup.contact.notify',  'SUP', 'PLACEHOLDER_WEBHOOK_ID_W5', true,  true, 'Send resolution update to contact'),
  ('ret.contact.winback', 'RET', 'PLACEHOLDER_WEBHOOK_ID_W6', true,  true, 'Enroll contact in winback sequence'),
  ('ret.account.flag',    'RET', 'PLACEHOLDER_WEBHOOK_ID_W7', false, true, 'Flag account for CSM review')
ON CONFLICT (action_id) DO UPDATE
  SET
    stage           = EXCLUDED.stage,
    n8n_workflow_id = EXCLUDED.n8n_workflow_id,
    requires_hitl   = EXCLUDED.requires_hitl,
    enabled         = EXCLUDED.enabled,
    description     = EXCLUDED.description,
    updated_at      = now();
