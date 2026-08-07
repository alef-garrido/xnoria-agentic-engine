-- Retention, Community & Expansion Stage Seed Pack
INSERT INTO filter_action (action_id, stage, n8n_workflow_id, requires_hitl, manual_action, enabled, description, description_es)
VALUES
  (
    'ret.contact.winback',
    'RET',
    'ret-contact-winback',
    true,
    false,
    true,
    'Enroll contact in winback sequence',
    'Inscribir contacto en secuencia de recuperación (winback)'
  ),
  (
    'ret.account.flag',
    'RET',
    'ret-account-flag',
    false,
    false,
    true,
    'Flag account for CSM review',
    'Marcar cuenta para revisión de CSM'
  ),
  (
    'com.content.publish',
    'COM',
    'com-content-publish',
    true,
    false,
    true,
    'Publish scheduled content to LinkedIn, Instagram, Threads — autonomous schedule + on-demand',
    'Publicar contenido programado en LinkedIn, Instagram y Threads — programación autónoma + bajo demanda'
  ),
  (
    'com.contact.reengage',
    'COM',
    'com-contact-reengage',
    false,
    false,
    true,
    'Re-engage a contact based on commercial signal (unsubscribed or low engagement)',
    'Re-enganchar a un contacto según señal comercial (desuscrito o baja participación)'
  ),
  (
    'com.feedback.request',
    'COM',
    'com-feedback-request',
    true,
    true,
    true,
    'Cannot automate on current HubSpot plan — operator must complete manually. Requires Private App Tasks scope.',
    'No automatizable con el plan actual de HubSpot — el operador debe completarlo manualmente. Requiere scope de Private App Tasks.'
  ),
  (
    'exp.account.flag',
    'EXP',
    'exp-account-flag',
    false,
    false,
    false,
    'Placeholder: Flag expansion-ready account',
    'Placeholder: Marcar cuenta lista para expansión'
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
