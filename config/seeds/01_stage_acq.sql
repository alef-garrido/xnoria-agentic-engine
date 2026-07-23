-- Acquisition Stage Seed Pack
INSERT INTO filter_action (action_id, stage, n8n_workflow_id, requires_hitl, enabled, description)
VALUES
  (
    'acq.lead.score',
    'ACQ',
    'acq-lead-score',
    false,
    true,
    'Score an incoming lead using rule-based logic and apply CRM tags in HubSpot'
  ),
  (
    'acq.lead.engage',
    'ACQ',
    'acq-lead-engage',
    false,
    true,
    'Send immediate WhatsApp acknowledgment to inbound lead'
  ),
  (
    'acq.lead.nurture',
    'ACQ',
    'acq-lead-nurture',
    false,
    true,
    'AI nurture conversation for out-of-hours contacts'
  ),
  (
    'acq.contact.outreach',
    'ACQ',
    'acq-contact-outreach',
    false,
    true,
    'Cold outreach via WhatsApp + email, sync to HubSpot'
  )
ON CONFLICT (action_id) DO UPDATE
  SET
    stage           = EXCLUDED.stage,
    n8n_workflow_id = EXCLUDED.n8n_workflow_id,
    requires_hitl   = EXCLUDED.requires_hitl,
    enabled         = EXCLUDED.enabled,
    description     = EXCLUDED.description,
    updated_at      = now();
