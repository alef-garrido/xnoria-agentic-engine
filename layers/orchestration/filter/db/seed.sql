-- ==============================================================================
-- Exnoria · Filter service · MVP seed data
-- Migration: 002_seed_filter_actions.sql
--
-- Seeds the three ACQ/SAL workflows as permitted actions.
-- n8n_workflow_id matches the webhook path defined in each workflow.
-- enabled = true means the action is live.
-- requires_hitl = false means auto-execute, no human approval needed for MVP.
-- ==============================================================================

INSERT INTO filter_action (action_id, stage, n8n_workflow_id, requires_hitl, enabled, description)
VALUES
  (
    'acq.lead.score',
    'ACQ',
    'acq-lead-score',
    false,
    true,
    'Score an incoming lead using rule-based logic and apply CRM tags in HubSpot'
  ),
  (
    'sal.sequence.enroll',
    'SAL',
    'sal-sequence-enroll',
    false,
    true,
    'Enroll a contact in a sales outreach sequence and update lifecycle stage in HubSpot'
  ),
  (
    'sal.contact.prioritize',
    'SAL',
    'sal-contact-prioritize',
    false,
    true,
    'Flag a contact for immediate SDR follow-up and send WhatsApp notification'
  )
ON CONFLICT (action_id) DO UPDATE
  SET
    stage           = EXCLUDED.stage,
    n8n_workflow_id = EXCLUDED.n8n_workflow_id,
    requires_hitl   = EXCLUDED.requires_hitl,
    enabled         = EXCLUDED.enabled,
    description     = EXCLUDED.description,
    updated_at      = now();
