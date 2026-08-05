-- Product Stage Seed Pack
INSERT INTO filter_action (action_id, stage, n8n_workflow_id, requires_hitl, enabled, description, description_es)
VALUES
  (
    'prd.adoption.nudge',
    'PRD',
    'prd-contact-nudge',
    false,
    true,
    'Send adoption nudge to low-engagement contact',
    'Enviar recordatorio de adopción al contacto con baja participación'
  ),
  (
    'prd.contact.educate',
    'PRD',
    'prd-contact-educate',
    false,
    true,
    'Send feature education message to workaround-using contact',
    'Enviar mensaje educativo sobre funcionalidades al contacto que usa workarounds'
  ),
  (
    'prd.feedback.log',
    'PRD',
    'prd-feedback-log',
    false,
    true,
    'Log enriched feature request to HubSpot product pipeline',
    'Registrar solicitud de funcionalidad enriquecida en el pipeline de producto de HubSpot'
  )
ON CONFLICT (action_id) DO UPDATE
  SET
    stage           = EXCLUDED.stage,
    n8n_workflow_id = EXCLUDED.n8n_workflow_id,
    requires_hitl   = EXCLUDED.requires_hitl,
    enabled         = EXCLUDED.enabled,
    description     = EXCLUDED.description,
    description_es  = EXCLUDED.description_es,
    updated_at      = now();
