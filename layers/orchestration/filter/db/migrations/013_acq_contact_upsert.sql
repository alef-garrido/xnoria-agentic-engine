-- ==============================================================================
-- Exnoria · Filter service · Migration 013
--
-- Registers acq.contact.upsert as a named filter action.
--
-- This action was previously seeded via seed.sql — that entry is being removed
-- from seed.sql to preserve migration sequence integrity. The ON CONFLICT path
-- will apply cleanly since the row already exists in the database.
--
-- IMPORTANT: The n8n_workflow_id 'acq-contact-upsert' is a placeholder.
-- Replace it with the real webhook path once the n8n workflow is built and
-- activated. The workflow MUST use "Respond to Webhook: Return JSON" with
-- { contact_id: "..." } in the response body for sequential chaining to work.
-- ==============================================================================

INSERT INTO filter_action (action_id, stage, n8n_workflow_id, requires_hitl, enabled, description)
VALUES (
  'acq.contact.upsert',
  'ACQ',
  'acq-contact-upsert',
  false,
  true,
  'Create or update a contact in HubSpot CRM, returns contact_id for chaining'
)
ON CONFLICT (action_id) DO UPDATE SET
  description = EXCLUDED.description,
  updated_at  = now();
