// ==============================================================================
// Exnoria · Cognitive · Tool definitions
// Fixed toolset exposed to the LLM — maps to the filter allowlist
// The agent can only call these tools, and each exits through the filter
// ==============================================================================
import { ToolDefinition } from '../shared/types';

export const TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'acq_lead_score',
      description:
        'Score an incoming lead using rule-based logic and apply CRM tags. ' +
        'Use when a new lead signal is received and needs qualification.',
      parameters: {
        type: 'object',
        properties: {
          contact_id: { type: 'string', description: 'HubSpot contact ID' },
          email:      { type: 'string', description: 'Contact email address' },
          source:     {
            type: 'string',
            enum: ['organic', 'referral', 'paid', 'unknown'],
            description: 'Lead acquisition source'
          }
        },
        required: ['contact_id', 'email', 'source']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'sal_sequence_enroll',
      description:
        'Enroll a contact in a sales outreach sequence. ' +
        'Use when a lead has been scored and is ready for sales follow-up.',
      parameters: {
        type: 'object',
        properties: {
          contact_id:  { type: 'string', description: 'HubSpot contact ID' },
          sequence_id: { type: 'string', description: 'Sequence identifier to enroll in' },
          reason:      { type: 'string', description: 'Why this contact is being enrolled' }
        },
        required: ['contact_id', 'reason']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'sal_contact_prioritize',
      description:
        'Flag a contact for immediate SDR follow-up and send a WhatsApp notification. ' +
        'Use for high-score leads or contacts showing strong buying intent.',
      parameters: {
        type: 'object',
        properties: {
          contact_id: { type: 'string', description: 'HubSpot contact ID' },
          priority:   {
            type: 'string',
            enum: ['high', 'medium', 'low'],
            description: 'Priority level for the SDR'
          },
          reason: { type: 'string', description: 'Why this contact needs immediate attention' }
        },
        required: ['contact_id', 'priority', 'reason']
      }
    }
  },

  // ---------------------------------------------------------------------------
  // Phase 2 — SUP (Support & Service) tools
  // ---------------------------------------------------------------------------
  {
    type: 'function',
    function: {
      name: 'sup_ticket_escalate',
      description:
        'Escalate an unresolved support ticket to the senior support queue. ' +
        'Use when signal_id is in the SUP domain AND signal_severity > 0.6 ' +
        'AND the ticket has been open more than 48 hours without resolution.',
      parameters: {
        type: 'object',
        properties: {
          contact_id:      { type: 'string', description: 'CRM contact ID' },
          ticket_id:       { type: 'string', description: 'Support ticket ID' },
          signal_id:       { type: 'string', description: 'Compass signal ID (e.g. SUP_RES_01)' },
          signal_severity: { type: 'number', description: 'Signal severity 0–1 from Compass' },
          open_days:       { type: 'number', description: 'Number of days ticket has been open' }
        },
        required: ['contact_id', 'ticket_id', 'signal_id', 'signal_severity', 'open_days']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'sup_contact_notify',
      description:
        'Send a resolution status update directly to the contact. ' +
        'Use when signal_id is in the SUP domain AND operator has context on resolution status to communicate. ' +
        'Requires HITL — always routes through human approval before sending external communication.',
      parameters: {
        type: 'object',
        properties: {
          contact_id:      { type: 'string', description: 'CRM contact ID' },
          ticket_id:       { type: 'string', description: 'Support ticket ID' },
          signal_id:       { type: 'string', description: 'Compass signal ID (e.g. SUP_RES_01)' },
          message_context: { type: 'string', description: 'Context for the resolution message to send' }
        },
        required: ['contact_id', 'ticket_id', 'signal_id', 'message_context']
      }
    }
  },

  // ---------------------------------------------------------------------------
  // Phase 2 — RET (Retention & Loyalty) tools
  // ---------------------------------------------------------------------------
  {
    type: 'function',
    function: {
      name: 'ret_contact_winback',
      description:
        'Enroll a contact in the winback sequence for churn prevention. ' +
        'Use when signal_id is in the RET domain AND signal_severity > 0.7. ' +
        'Requires HITL — external sequence enrollment is irreversible.',
      parameters: {
        type: 'object',
        properties: {
          contact_id:      { type: 'string', description: 'CRM contact ID' },
          signal_id:       { type: 'string', description: 'Compass signal ID (e.g. RET_VAL_01)' },
          signal_severity: { type: 'number', description: 'Signal severity 0–1 from Compass' },
          cause_code:      { type: 'string', description: 'Compass cause code (e.g. RET-VAL)' }
        },
        required: ['contact_id', 'signal_id', 'signal_severity', 'cause_code']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'ret_account_flag',
      description:
        'Flag an account for immediate CSM review due to churn risk. ' +
        'Use when signal_id is in the RET domain AND signal_severity > 0.5. ' +
        'Use as a lower-threshold first step before enrolling in winback.',
      parameters: {
        type: 'object',
        properties: {
          contact_id:      { type: 'string', description: 'CRM contact ID' },
          account_id:      { type: 'string', description: 'CRM account ID' },
          signal_id:       { type: 'string', description: 'Compass signal ID (e.g. RET_REL_01)' },
          signal_severity: { type: 'number', description: 'Signal severity 0–1 from Compass' }
        },
        required: ['contact_id', 'account_id', 'signal_id', 'signal_severity']
      }
    }
  },

  // ---------------------------------------------------------------------------
  // Reply — local handler, not dispatched to filter
  // ---------------------------------------------------------------------------
  {
    type: 'function',
    function: {
      name: 'reply',
      description:
        'Send a message back to the contact through the channel they used. ' +
        'Use to acknowledge, inform, or ask a follow-up question.',
      parameters: {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'The reply message to send' }
        },
        required: ['message']
      }
    }
  }
];

// Map from LLM function name → filter action_id + stage
export const TOOL_TO_ACTION: Record<string, { action_id: string; stage: string } | null> = {
  acq_lead_score:         { action_id: 'acq.lead.score',        stage: 'ACQ' },
  sal_sequence_enroll:    { action_id: 'sal.sequence.enroll',    stage: 'SAL' },
  sal_contact_prioritize: { action_id: 'sal.contact.prioritize', stage: 'SAL' },

  // Phase 2 — SUP + RET
  sup_ticket_escalate:    { action_id: 'sup.ticket.escalate',    stage: 'SUP' },
  sup_contact_notify:     { action_id: 'sup.contact.notify',     stage: 'SUP' },
  ret_contact_winback:    { action_id: 'ret.contact.winback',    stage: 'RET' },
  ret_account_flag:       { action_id: 'ret.account.flag',       stage: 'RET' },

  reply:                  null  // handled locally, not dispatched to filter
};

