-- ==============================================================================
-- Exnoria · Filter service · Migration 017
--
-- Registers acq.contact.get as a named filter action.
--
-- This action retrieves a contact from HubSpot by email or contact_id,
-- returning standard and custom CX properties (cx_pain_points, cx_pci).
-- It is a read-only CRM operation — no HITL required.
-- ==============================================================================

INSERT INTO filter_action (action_id, stage, n8n_workflow_id, requires_hitl, enabled, description)
VALUES (
  'acq.contact.get',
  'ACQ',
  'acq-contact-get',
  false,
  true,
  'Retrieve contact properties from HubSpot including CX pain points and PCI score'
)
ON CONFLICT (action_id) DO UPDATE SET
  description = EXCLUDED.description,
  updated_at  = now();
