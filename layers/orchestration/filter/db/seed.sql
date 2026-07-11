-- ==============================================================================
-- Exnoria · Filter service · MVP seed data
-- Migration: 002_seed_filter_actions.sql
--
-- Seeds the MVP ACQ/SAL/SUP/RET/ONB/PRD workflows as permitted actions.
-- n8n_workflow_id matches the webhook path defined in each workflow.
-- enabled = true means the action is live.
-- requires_hitl = false means auto-execute, no human approval needed for MVP.
--
-- NOTE: acq.contact.upsert was moved to migration 013_acq_contact_upsert.sql.
-- Post-MVP actions must use numbered migrations, NOT this seed file.
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
    true,
    true,
    'Flag a contact for immediate SDR follow-up and send WhatsApp notification'
  ),
  (
    'sup.ticket.escalate',
    'SUP',
    'sup-ticket-escalate',
    false,
    true,
    'Escalate ticket to senior support queue'
  ),
  (
    'sup.contact.notify',
    'SUP',
    'sup-contact-notify',
    true,
    true,
    'Send resolution update to contact'
  ),
  (
    'ret.contact.winback',
    'RET',
    'ret-contact-winback',
    true,
    true,
    'Enroll contact in winback sequence'
  ),
  (
    'ret.account.flag',
    'RET',
    'ret-account-flag',
    false,
    true,
    'Flag account for CSM review'
  ),
  (
    'onb.contact.nudge',
    'ONB',
    'onb-contact-nudge',
    false,
    true,
    'Send re-engagement nudge to stalled onboarding contact'
  ),
  (
    'onb.contact.assist',
    'ONB',
    'onb-contact-assist',
    true,
    true,
    'Offer white-glove CSM assist to blocked onboarding contact'
  ),
  (
    'onb.ticket.escalate',
    'ONB',
    'onb-ticket-escalate',
    false,
    true,
    'Escalate technical onboarding blocker to support queue'
  ),
  (
    'prd.adoption.nudge',
    'PRD',
    'prd-contact-nudge',
    false,
    true,
    'Send adoption nudge to low-engagement contact'
  ),
  (
    'prd.contact.educate',
    'PRD',
    'prd-contact-educate',
    false,
    true,
    'Send feature education message to workaround-using contact'
  ),
  (
    'prd.feedback.log',
    'PRD',
    'prd-feedback-log',
    false,
    true,
    'Log enriched feature request to HubSpot product pipeline'
  )
ON CONFLICT (action_id) DO UPDATE
  SET
    stage           = EXCLUDED.stage,
    n8n_workflow_id = EXCLUDED.n8n_workflow_id,
    requires_hitl   = EXCLUDED.requires_hitl,
    enabled         = EXCLUDED.enabled,
    description     = EXCLUDED.description,
    updated_at      = now();
