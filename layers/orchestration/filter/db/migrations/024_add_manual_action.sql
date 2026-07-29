-- ==============================================================================
-- Migration 024: Add manual_action column to filter_action
--
-- Some actions (sal.sequence.enroll, onb.document.request, com.feedback.request)
-- cannot be automated on the current HubSpot plan (Sequences upgrade-locked,
-- Tasks scope not available in Private App token).
--
-- The manual_action flag reuses the existing HITL infrastructure:
--   requires_hitl + manual_action = true → operator notified, but approval marks
--   as executed WITHOUT dispatching to n8n. Operator completes the action manually.
-- ==============================================================================

ALTER TABLE filter_action
  ADD COLUMN manual_action BOOLEAN NOT NULL DEFAULT false;

-- Mark HubSpot-gated actions as manual
UPDATE filter_action
SET
  requires_hitl  = true,
  manual_action  = true,
  description    = 'Cannot automate on current HubSpot plan — operator must complete manually in HubSpot. Requires HubSpot Sequences upgrade or Tasks scope.',
  updated_at     = now()
WHERE action_id IN ('sal.sequence.enroll', 'onb.document.request', 'com.feedback.request');
