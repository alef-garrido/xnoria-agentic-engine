-- ==============================================================================
-- Exnoria · Filter service · Replace placeholder webhook IDs
-- Migration: 005_update_workflow_ids.sql
--
-- PURPOSE: After building the real n8n workflows (W4–W7) in the n8n UI,
-- replace the placeholder webhook IDs with the actual n8n webhook paths.
--
-- INSTRUCTIONS:
--   1. Build each workflow in n8n UI at localhost:5678
--   2. Copy the webhook path from each workflow's Webhook trigger node
--   3. Replace the <REAL_...> values below with the actual webhook paths
--   4. Run this migration
--   5. Export each workflow JSON and overwrite the stub files in workflows/n8n/
-- ==============================================================================

UPDATE filter_action SET n8n_workflow_id = 'sup-ticket-escalate' WHERE action_id = 'sup.ticket.escalate';
UPDATE filter_action SET n8n_workflow_id = 'sup-contact-notify' WHERE action_id = 'sup.contact.notify';
UPDATE filter_action SET n8n_workflow_id = 'ret-contact-winback' WHERE action_id = 'ret.contact.winback';
UPDATE filter_action SET n8n_workflow_id = 'ret-account-flag' WHERE action_id = 'ret.account.flag';
