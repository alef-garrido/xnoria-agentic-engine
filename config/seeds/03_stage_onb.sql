-- Onboarding Stage Seed Pack
INSERT INTO filter_action (action_id, stage, n8n_workflow_id, requires_hitl, manual_action, enabled, description)
VALUES
  (
    'onb.contact.nudge',
    'ONB',
    'onb-contact-nudge',
    false,
    false,
    true,
    'Send re-engagement nudge to stalled onboarding contact'
  ),
  (
    'onb.contact.assist',
    'ONB',
    'onb-contact-assist',
    true,
    false,
    true,
    'Offer white-glove CSM assist to blocked onboarding contact'
  ),
  (
    'onb.ticket.escalate',
    'ONB',
    'onb-ticket-escalate',
    false,
    false,
    true,
    'Escalate technical onboarding blocker to support queue'
  ),
  (
    'onb.document.request',
    'ONB',
    'onb-document-request',
    true,
    true,
    true,
    'Cannot automate on current HubSpot plan — operator must complete manually in HubSpot. Requires Private App Tasks scope.'
  ),
  (
    'onb.document.validate',
    'ONB',
    'onb-document-validate',
    false,
    false,
    true,
    'Validate submitted document, update CRM'
  )
ON CONFLICT (action_id) DO UPDATE
  SET
    stage           = EXCLUDED.stage,
    n8n_workflow_id = EXCLUDED.n8n_workflow_id,
    requires_hitl   = EXCLUDED.requires_hitl,
    manual_action   = EXCLUDED.manual_action,
    enabled         = EXCLUDED.enabled,
    description     = EXCLUDED.description,
    updated_at      = now();
