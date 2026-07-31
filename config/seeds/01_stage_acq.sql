-- Acquisition Stage Seed Pack
INSERT INTO filter_action (action_id, stage, n8n_workflow_id, requires_hitl, manual_action, enabled, description)
VALUES
  (
    'acq.lead.score',
    'ACQ',
    'xnoria-acq-lead-score-v1',
    false,
    false,
    true,
    'Score an incoming lead using rule-based logic and apply CRM tags in HubSpot'
  ),
  (
    'acq.lead.engage',
    'ACQ',
    'acq-lead-engage',
    false,
    false,
    true,
    'Send immediate WhatsApp acknowledgment to inbound lead'
  ),
  (
    'acq.lead.nurture',
    'ACQ',
    'acq-lead-nurture',
    false,
    false,
    true,
    'AI nurture conversation for out-of-hours contacts'
  ),
  (
    'acq.contact.outreach',
    'ACQ',
    'acq-contact-outreach',
    true,
    false,
    true,
    'Cold outreach via WhatsApp + email, sync to HubSpot — requires HITL operator review before sending'
  ),
  (
    'acq.contact.upsert',
    'ACQ',
    'acq-contact-upsert',
    false,
    false,
    true,
    'Create or update a contact in HubSpot CRM, returns contact_id for chaining'
  ),
  (
    'acq.contact.get',
    'ACQ',
    'acq-contact-get',
    false,
    false,
    true,
    'Retrieve contact properties from HubSpot including CX pain points and PCI score'
  )
ON CONFLICT (action_id) DO UPDATE
  SET
    stage           = EXCLUDED.stage,
    n8n_workflow_id = EXCLUDED.n8n_workflow_id,
    requires_hitl   = EXCLUDED.requires_hitl,
    manual_action   = EXCLUDED.manual_action,
    enabled         = EXCLUDED.enabled,
    description     = EXCLUDED.description,
    updated_at      = now();
