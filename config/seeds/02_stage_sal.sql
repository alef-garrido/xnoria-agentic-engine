-- Sales Stage Seed Pack
INSERT INTO filter_action (action_id, stage, n8n_workflow_id, requires_hitl, manual_action, enabled, description)
VALUES
  (
    'sal.sequence.enroll',
    'SAL',
    'sal-sequence-enroll',
    true,
    true,
    true,
    'Cannot automate on current HubSpot plan — operator must complete manually in HubSpot. Requires HubSpot Sequences upgrade.'
  ),
  (
    'sal.contact.prioritize',
    'SAL',
    'sal-contact-prioritize',
    true,
    false,
    true,
    'Flag a contact for immediate SDR follow-up and send WhatsApp notification'
  ),
  (
    'sal.contact.message',
    'SAL',
    'sal-contact-message',
    false,
    false,
    true,
    'Send pre-composed WhatsApp message to contact'
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
