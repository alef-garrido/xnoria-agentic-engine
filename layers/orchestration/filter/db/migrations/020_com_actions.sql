-- ==============================================================================
-- Migration 020: Register COM (Commercial) actions
-- Registers com.contact.reengage and com.feedback.request in filter_action
-- com.content.publish was already registered in migration 006
-- ==============================================================================

INSERT INTO filter_action (action_id, stage, n8n_workflow_id, requires_hitl, enabled, description)
VALUES
  ('com.contact.reengage', 'COM', 'com-contact-reengage', false, true, 'Re-engage a contact based on commercial signal (unsubscribed or low engagement)'),
  ('com.feedback.request', 'COM', 'com-feedback-request', false, true, 'Send feedback follow-up to contact with ignored or unacknowledged feedback')
ON CONFLICT (action_id) DO NOTHING;
