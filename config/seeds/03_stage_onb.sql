-- Onboarding Stage Seed Pack
INSERT INTO filter_action (action_id, stage, n8n_workflow_id, requires_hitl, manual_action, enabled, description, description_es)
VALUES
  (
    'onb.contact.nudge',
    'ONB',
    'onb-contact-nudge',
    false,
    false,
    true,
    'Send re-engagement nudge to stalled onboarding contact',
    'Enviar recordatorio de re-enganche al contacto de onboarding estancado'
  ),
  (
    'onb.contact.assist',
    'ONB',
    'onb-contact-assist',
    true,
    false,
    true,
    'Offer white-glove CSM assist to blocked onboarding contact',
    'Ofrecer asistencia CSM personalizada al contacto de onboarding bloqueado'
  ),
  (
    'onb.ticket.escalate',
    'ONB',
    'onb-ticket-escalate',
    false,
    false,
    true,
    'Escalate technical onboarding blocker to support queue',
    'Escalar bloqueante técnico de onboarding a la cola de soporte'
  ),
  (
    'onb.document.request',
    'ONB',
    'onb-document-request',
    true,
    true,
    true,
    'Cannot automate on current HubSpot plan — operator must complete manually in HubSpot. Requires Private App Tasks scope.',
    'No automatizable con el plan actual de HubSpot — el operador debe completarlo manualmente en HubSpot. Requiere scope de Private App Tasks.'
  ),
  (
    'onb.document.validate',
    'ONB',
    'onb-document-validate',
    false,
    false,
    true,
    'Validate submitted document, update CRM',
    'Validar documento enviado y actualizar el CRM'
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
