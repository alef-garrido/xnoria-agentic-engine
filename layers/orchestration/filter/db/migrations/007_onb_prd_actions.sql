-- ==============================================================================
-- Exnoria · Filter service · Phase 3 — A3 ONB + PRD actions
-- Migration: 007_onb_prd_actions.sql
--
-- Registers 3 new ONB actions and updates 2 PRD placeholders + 1 new PRD action.
-- Webhook IDs use PLACEHOLDER_WEBHOOK_* naming — replace with real IDs in
-- migration 008_update_workflow_ids.sql after n8n import.
--
-- ON CONFLICT policy (same as 006):
--   n8n_workflow_id, requires_hitl, description are updated on re-run.
--   enabled is intentionally NOT updated on conflict — operator manual state
--   must not be silently overwritten.
-- ==============================================================================

-- ONB: new actions (Phase 3 A3)
INSERT INTO filter_action (action_id, stage, n8n_workflow_id, requires_hitl, enabled, description)
VALUES
  ('onb.contact.nudge',   'ONB', 'PLACEHOLDER_WEBHOOK_ONB_03', false, true,  'Send re-engagement nudge to stalled onboarding contact'),
  ('onb.contact.assist',  'ONB', 'PLACEHOLDER_WEBHOOK_ONB_04', true,  true,  'Offer white-glove CSM assist to blocked onboarding contact'),
  ('onb.ticket.escalate', 'ONB', 'PLACEHOLDER_WEBHOOK_ONB_05', false, true,  'Escalate technical onboarding blocker to support queue')
ON CONFLICT (action_id) DO UPDATE SET
  n8n_workflow_id = EXCLUDED.n8n_workflow_id,
  requires_hitl   = EXCLUDED.requires_hitl,
  description     = EXCLUDED.description,
  updated_at      = now();
  -- enabled intentionally excluded: operator manual state must not be overwritten

-- PRD: replace placeholders from migration 006 + add new action (Phase 3 A3)
-- prd.friction.flag → superseded by prd.contact.nudge (updates existing row)
-- prd.adoption.nudge → superseded by prd.contact.educate (updates existing row)
-- prd.feedback.log → net-new action
INSERT INTO filter_action (action_id, stage, n8n_workflow_id, requires_hitl, enabled, description)
VALUES
  ('prd.friction.flag',   'PRD', 'PLACEHOLDER_WEBHOOK_PRD_01', false, true,  'Send adoption nudge to low-engagement contact — replaces placeholder'),
  ('prd.adoption.nudge',  'PRD', 'PLACEHOLDER_WEBHOOK_PRD_02', false, true,  'Send feature education message to contact using workarounds — replaces placeholder'),
  ('prd.feedback.log',    'PRD', 'PLACEHOLDER_WEBHOOK_PRD_03', false, true,  'Log enriched feature request to HubSpot product pipeline')
ON CONFLICT (action_id) DO UPDATE SET
  n8n_workflow_id = EXCLUDED.n8n_workflow_id,
  requires_hitl   = EXCLUDED.requires_hitl,
  description     = EXCLUDED.description,
  updated_at      = now();
  -- enabled intentionally excluded: preserves manual operator state from 006
