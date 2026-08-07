INSERT INTO filter_action (action_id, stage, n8n_workflow_id, requires_hitl, enabled, description)
VALUES ('exp.contact.upgrade', 'EXP', 'exp-contact-upgrade', false, true, 'Contact contact about an upgrade opportunity')
ON CONFLICT (action_id) DO NOTHING;
