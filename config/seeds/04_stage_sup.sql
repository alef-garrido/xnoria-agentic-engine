-- Support Stage Seed Pack
INSERT INTO filter_action (action_id, stage, n8n_workflow_id, requires_hitl, enabled, description)
VALUES
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
  )
ON CONFLICT (action_id) DO UPDATE
  SET
    stage           = EXCLUDED.stage,
    n8n_workflow_id = EXCLUDED.n8n_workflow_id,
    requires_hitl   = EXCLUDED.requires_hitl,
    enabled         = EXCLUDED.enabled,
    description     = EXCLUDED.description,
    updated_at      = now();
