-- ==============================================================================
-- Exnoria · Filter service · Phase 3 — Update workflow IDs (A3)
-- Migration: 008_update_workflow_ids.sql
--
-- Replaces PLACEHOLDER_WEBHOOK_* IDs with real n8n webhook paths.
-- Workflows created via n8n-mcp and activated. Webhook paths are the
-- path values set in each workflow's Webhook node.
--
-- n8n workflow IDs (for reference):
--   onb.contact.nudge    → 3d1Soda8wKN6Cjje  (path: onb-contact-nudge)
--   onb.contact.assist   → 2iEiCh7DmfFHW0vN  (path: onb-contact-assist)
--   onb.ticket.escalate  → 6PX2Lzvxkqs1CkRn  (path: onb-ticket-escalate)
--   prd.friction.flag    → IPTNs0bu7PCyaHdP   (path: prd-contact-nudge)
--   prd.adoption.nudge   → QxvfFxVPaIepfkv9   (path: prd-contact-educate)
--   prd.feedback.log     → 6G9DdnUnYvnqVxp2   (path: prd-feedback-log)
-- ==============================================================================

-- ONB workflows (Phase 3 A3)
UPDATE filter_action SET n8n_workflow_id = 'onb-contact-nudge',   updated_at = now() WHERE action_id = 'onb.contact.nudge';
UPDATE filter_action SET n8n_workflow_id = 'onb-contact-assist',  updated_at = now() WHERE action_id = 'onb.contact.assist';
UPDATE filter_action SET n8n_workflow_id = 'onb-ticket-escalate', updated_at = now() WHERE action_id = 'onb.ticket.escalate';

-- PRD workflows (Phase 3 A3)
UPDATE filter_action SET n8n_workflow_id = 'prd-contact-nudge',   updated_at = now() WHERE action_id = 'prd.friction.flag';
UPDATE filter_action SET n8n_workflow_id = 'prd-contact-educate', updated_at = now() WHERE action_id = 'prd.adoption.nudge';
UPDATE filter_action SET n8n_workflow_id = 'prd-feedback-log',    updated_at = now() WHERE action_id = 'prd.feedback.log';
