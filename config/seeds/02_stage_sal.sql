-- Sales Stage Seed Pack
INSERT INTO filter_action (action_id, stage, n8n_workflow_id, requires_hitl, manual_action, enabled, description, description_es)
VALUES
  (
    'sal.sequence.enroll',
    'SAL',
    'sal-sequence-enroll',
    true,
    true,
    true,
    'Cannot automate on current HubSpot plan — operator must complete manually in HubSpot. Requires HubSpot Sequences upgrade.',
    'No automatizable con el plan actual de HubSpot — el operador debe completarlo manualmente en HubSpot. Requiere upgrade de Sequences.'
  ),
  (
    'sal.contact.prioritize',
    'SAL',
    'sal-contact-prioritize',
    true,
    false,
    true,
    'Flag a contact for immediate SDR follow-up and send WhatsApp notification',
    'Marcar un contacto para seguimiento inmediato de SDR y enviar notificación por WhatsApp'
  ),
  (
    'sal.contact.message',
    'SAL',
    'sal-contact-message',
    false,
    false,
    true,
    'Send pre-composed WhatsApp message to contact',
    'Enviar mensaje de WhatsApp precompuesto al contacto'
  )
ON CONFLICT (action_id) DO UPDATE
  SET
    stage           = EXCLUDED.stage,
    n8n_workflow_id = EXCLUDED.n8n_workflow_id,
    requires_hitl   = EXCLUDED.requires_hitl,
    manual_action   = EXCLUDED.manual_action,
    enabled         = EXCLUDED.enabled,
    description     = EXCLUDED.description,
    description_es  = EXCLUDED.description_es,
    updated_at      = now();
