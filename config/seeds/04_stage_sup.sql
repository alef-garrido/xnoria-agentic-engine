-- Support Stage Seed Pack
INSERT INTO filter_action (action_id, stage, n8n_workflow_id, requires_hitl, enabled, description, description_es)
VALUES
  (
    'sup.ticket.escalate',
    'SUP',
    'sup-ticket-escalate',
    false,
    true,
    'Escalate ticket to senior support queue',
    'Escalar ticket a la cola de soporte senior'
  ),
  (
    'sup.contact.notify',
    'SUP',
    'sup-contact-notify',
    true,
    true,
    'Send resolution update to contact',
    'Enviar actualización de resolución al contacto'
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
