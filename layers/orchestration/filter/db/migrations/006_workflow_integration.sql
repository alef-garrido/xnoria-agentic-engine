-- ==============================================================================
-- Exnoria · Filter service · Phase 2.5 workflow integration
-- Migration: 006_workflow_integration.sql
--
-- Registers 10 new actions across ACQ, SAL, ONB, COM, PRD, EXP stages.
-- PRD and EXP actions are registered with enabled = false (placeholders).
--
-- ON CONFLICT policy:
--   n8n_workflow_id, requires_hitl, description are updated on re-run.
--   enabled is intentionally NOT updated on conflict — if an operator has
--   manually disabled an action via the allowlist manager, this migration
--   must not silently re-enable it.
-- ==============================================================================

-- ACQ: new actions
INSERT INTO filter_action (action_id, stage, n8n_workflow_id, requires_hitl, enabled, description)
VALUES
  ('acq.lead.engage',      'ACQ', 'acq-lead-engage',      false, true,  'Send immediate WhatsApp acknowledgment to new inbound lead'),
  ('acq.lead.nurture',     'ACQ', 'acq-lead-nurture',     false, true,  'Engage out-of-hours inbound contact with AI nurture conversation'),
  ('acq.contact.outreach', 'ACQ', 'acq-contact-outreach', true,  true,  'Send cold outreach via WhatsApp and email, sync to HubSpot')
ON CONFLICT (action_id) DO UPDATE SET
  n8n_workflow_id = EXCLUDED.n8n_workflow_id,
  requires_hitl   = EXCLUDED.requires_hitl,
  description     = EXCLUDED.description,
  updated_at      = now();
  -- enabled intentionally excluded: operator manual state must not be overwritten

-- SAL: new action
INSERT INTO filter_action (action_id, stage, n8n_workflow_id, requires_hitl, enabled, description)
VALUES
  ('sal.contact.message',  'SAL', 'sal-contact-message',  false, true,  'Send pre-composed WhatsApp message to SAL stage contact')
ON CONFLICT (action_id) DO UPDATE SET
  n8n_workflow_id = EXCLUDED.n8n_workflow_id,
  requires_hitl   = EXCLUDED.requires_hitl,
  description     = EXCLUDED.description,
  updated_at      = now();

-- ONB: new actions
INSERT INTO filter_action (action_id, stage, n8n_workflow_id, requires_hitl, enabled, description)
VALUES
  ('onb.document.request',  'ONB', 'onb-document-request',  false, true,  'Initiate document collection request for onboarding contact'),
  ('onb.document.validate', 'ONB', 'onb-document-validate', false, true,  'Validate submitted document and update contact record in CRM')
ON CONFLICT (action_id) DO UPDATE SET
  n8n_workflow_id = EXCLUDED.n8n_workflow_id,
  requires_hitl   = EXCLUDED.requires_hitl,
  description     = EXCLUDED.description,
  updated_at      = now();

-- COM: new action
INSERT INTO filter_action (action_id, stage, n8n_workflow_id, requires_hitl, enabled, description)
VALUES
  ('com.content.publish',  'COM', 'com-content-publish',   true,  true,  'Publish scheduled content to LinkedIn, Instagram, Threads — autonomous schedule + on-demand')
ON CONFLICT (action_id) DO UPDATE SET
  n8n_workflow_id = EXCLUDED.n8n_workflow_id,
  requires_hitl   = EXCLUDED.requires_hitl,
  description     = EXCLUDED.description,
  updated_at      = now();

-- PRD: placeholders (disabled — no workflow built, Phase 3)
INSERT INTO filter_action (action_id, stage, n8n_workflow_id, requires_hitl, enabled, description)
VALUES
  ('prd.friction.flag',   'PRD', 'PLACEHOLDER_WEBHOOK_PRD_01', false, false, 'PLACEHOLDER: Flag contact experiencing product friction for review'),
  ('prd.adoption.nudge',  'PRD', 'PLACEHOLDER_WEBHOOK_PRD_02', true,  false, 'PLACEHOLDER: Send adoption nudge to low-engagement contact')
ON CONFLICT (action_id) DO UPDATE SET
  n8n_workflow_id = EXCLUDED.n8n_workflow_id,
  requires_hitl   = EXCLUDED.requires_hitl,
  description     = EXCLUDED.description,
  updated_at      = now();

-- EXP: placeholder (disabled — no workflow built, Phase 4)
INSERT INTO filter_action (action_id, stage, n8n_workflow_id, requires_hitl, enabled, description)
VALUES
  ('exp.account.flag',    'EXP', 'PLACEHOLDER_WEBHOOK_EXP_01', false, false, 'PLACEHOLDER: Flag account as expansion-ready for AE/CSM review')
ON CONFLICT (action_id) DO UPDATE SET
  n8n_workflow_id = EXCLUDED.n8n_workflow_id,
  requires_hitl   = EXCLUDED.requires_hitl,
  description     = EXCLUDED.description,
  updated_at      = now();
