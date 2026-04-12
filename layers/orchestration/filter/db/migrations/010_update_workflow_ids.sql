-- ==============================================================================
-- Exnoria · Filter service · Update ALL workflow IDs with final paths
-- Migration: 010_update_workflow_ids.sql
-- ==============================================================================

BEGIN;

-- ACQ
UPDATE filter_action SET n8n_workflow_id = 'acq-lead-engage', updated_at = now() WHERE action_id = 'acq.lead.engage';
UPDATE filter_action SET n8n_workflow_id = 'acq-lead-nurture', updated_at = now() WHERE action_id = 'acq.lead.nurture';
UPDATE filter_action SET n8n_workflow_id = 'acq-contact-outreach', updated_at = now() WHERE action_id = 'acq.contact.outreach';

-- SAL
UPDATE filter_action SET n8n_workflow_id = 'sal-contact-message', updated_at = now() WHERE action_id = 'sal.contact.message';

-- ONB
UPDATE filter_action SET n8n_workflow_id = 'onb-document-request', updated_at = now() WHERE action_id = 'onb.document.request';
UPDATE filter_action SET n8n_workflow_id = 'onb-document-validate', updated_at = now() WHERE action_id = 'onb.document.validate';
UPDATE filter_action SET n8n_workflow_id = 'onb-contact-nudge', updated_at = now() WHERE action_id = 'onb.contact.nudge';
UPDATE filter_action SET n8n_workflow_id = 'onb-contact-assist', updated_at = now() WHERE action_id = 'onb.contact.assist';
UPDATE filter_action SET n8n_workflow_id = 'onb-ticket-escalate', updated_at = now() WHERE action_id = 'onb.ticket.escalate';

-- PRD (superseded endpoints mapped correctly)
UPDATE filter_action SET n8n_workflow_id = 'prd-contact-nudge', updated_at = now() WHERE action_id = 'prd.friction.flag';
UPDATE filter_action SET n8n_workflow_id = 'prd-contact-educate', updated_at = now() WHERE action_id = 'prd.adoption.nudge';
UPDATE filter_action SET n8n_workflow_id = 'prd-feedback-log', updated_at = now() WHERE action_id = 'prd.feedback.log';

-- SUP
UPDATE filter_action SET n8n_workflow_id = 'sup-ticket-escalate', updated_at = now() WHERE action_id = 'sup.ticket.escalate';
UPDATE filter_action SET n8n_workflow_id = 'sup-contact-notify', updated_at = now() WHERE action_id = 'sup.contact.notify';

-- COM
UPDATE filter_action SET n8n_workflow_id = 'com-content-publish', updated_at = now() WHERE action_id = 'com.content.publish';

-- RET
UPDATE filter_action SET n8n_workflow_id = 'ret-contact-winback', updated_at = now() WHERE action_id = 'ret.contact.winback';
UPDATE filter_action SET n8n_workflow_id = 'ret-account-flag', updated_at = now() WHERE action_id = 'ret.account.flag';

COMMIT;
