-- Onboarding Stage Seed Pack
INSERT INTO filter_action (action_id, stage, n8n_workflow_id, requires_hitl, enabled, description)
VALUES
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
    'onb.document.request',
    'ONB',
    'onb-document-request',
    false,
    true,
    'Initiate document collection request'
  ),
  (
    'onb.document.validate',
    'ONB',
    'onb-document-validate',
    false,
    true,
    'Validate submitted document, update CRM'
  )
ON CONFLICT (action_id) DO UPDATE
  SET
    stage           = EXCLUDED.stage,
    n8n_workflow_id = EXCLUDED.n8n_workflow_id,
    requires_hitl   = EXCLUDED.requires_hitl,
    enabled         = EXCLUDED.enabled,
    description     = EXCLUDED.description,
    updated_at      = now();
