-- Product Stage Seed Pack
INSERT INTO filter_action (action_id, stage, n8n_workflow_id, requires_hitl, enabled, description)
VALUES
  (
    'prd.adoption.nudge',
    'PRD',
    'prd-contact-nudge',
    false,
    true,
    'Send adoption nudge to low-engagement contact'
  ),
  (
    'prd.contact.educate',
    'PRD',
    'prd-contact-educate',
    false,
    true,
    'Send feature education message to workaround-using contact'
  ),
  (
    'prd.feedback.log',
    'PRD',
    'prd-feedback-log',
    false,
    true,
    'Log enriched feature request to HubSpot product pipeline'
  )
ON CONFLICT (action_id) DO UPDATE
  SET
    stage           = EXCLUDED.stage,
    n8n_workflow_id = EXCLUDED.n8n_workflow_id,
    requires_hitl   = EXCLUDED.requires_hitl,
    enabled         = EXCLUDED.enabled,
    description     = EXCLUDED.description,
    updated_at      = now();
