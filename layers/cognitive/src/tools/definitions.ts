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
  acq_lead_score:       { action_id: 'acq.lead.score',        stage: 'ACQ' },
  sal_sequence_enroll:  { action_id: 'sal.sequence.enroll',   stage: 'SAL' },
  sal_contact_prioritize: { action_id: 'sal.contact.prioritize', stage: 'SAL' },
  reply:                null  // handled locally, not dispatched to filter
};
