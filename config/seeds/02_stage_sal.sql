-- Sales Stage Seed Pack
INSERT INTO filter_action (action_id, stage, n8n_workflow_id, requires_hitl, enabled, description)
VALUES
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
    'sal.contact.message',
    'SAL',
    'sal-contact-message',
    false,
    true,
    'Send pre-composed WhatsApp message to contact'
  )
ON CONFLICT (action_id) DO UPDATE
  SET
    stage           = EXCLUDED.stage,
    n8n_workflow_id = EXCLUDED.n8n_workflow_id,
    requires_hitl   = EXCLUDED.requires_hitl,
    enabled         = EXCLUDED.enabled,
    description     = EXCLUDED.description,
    updated_at      = now();
