-- Retention, Community & Expansion Stage Seed Pack
INSERT INTO filter_action (action_id, stage, n8n_workflow_id, requires_hitl, enabled, description)
VALUES
  (
    'ret.contact.winback',
    'RET',
    'ret-contact-winback',
    true,
    true,
    'Enroll contact in winback sequence'
  ),
  (
    'ret.account.flag',
    'RET',
    'ret-account-flag',
    false,
    true,
    'Flag account for CSM review'
  ),
  (
    'com.content.publish',
    'COM',
    'com-content-publish',
    false,
    true,
    'Publish scheduled content to social media'
  ),
  (
    'exp.account.flag',
    'EXP',
    'exp-account-flag',
    false,
    false,
    'Placeholder: Flag expansion-ready account'
  )
ON CONFLICT (action_id) DO UPDATE
  SET
    stage           = EXCLUDED.stage,
    n8n_workflow_id = EXCLUDED.n8n_workflow_id,
    requires_hitl   = EXCLUDED.requires_hitl,
    enabled         = EXCLUDED.enabled,
    description     = EXCLUDED.description,
    updated_at      = now();
