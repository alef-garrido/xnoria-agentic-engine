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
      name: 'crm_contact_upsert',
      description:
        'Upsert (create or update) a contact in HubSpot. ' +
        'Use when you need a contact_id to perform subsequent actions but the contact does not exist yet. ' +
        'This tool will return the generated contact_id if successful. ' +
        'Accepts all standard contact fields — extract as many as possible from the message.',
      parameters: {
        type: 'object',
        properties: {
          email:            { type: 'string', description: 'Contact email address (correo electrónico)' },
          first_name:       { type: 'string', description: 'Contact first name (nombre de contacto)' },
          last_name:        { type: 'string', description: 'Contact last name (apellido)' },
          phone:            { type: 'string', description: 'Primary phone number (teléfono principal)' },
          company:          { type: 'string', description: 'Company name (empresa / nombre de la compañía)' },
          industry:         { type: 'string', description: 'Industry (industria / giro de la empresa, e.g. retail, manufacturing, technology)' },
          city:             { type: 'string', description: 'City (ciudad)' },
          address:          { type: 'string', description: 'Street address (dirección / calle y número)' },
          colonia:          { type: 'string', description: 'Neighborhood or district (colonia / fraccionamiento)' },
          postal_code:      { type: 'string', description: 'Postal / ZIP code (código postal)' },
          website:          { type: 'string', description: 'Website URL (sitio web)' },
          linkedin:         { type: 'string', description: 'Company or personal LinkedIn URL (URL de LinkedIn)' },
          contact_linkedin: { type: 'string', description: 'Contact person\'s LinkedIn URL (LinkedIn del contacto)' },
          facebook:         { type: 'string', description: 'Facebook ID or profile URL (ID o perfil de Facebook)' },
          instagram:        { type: 'string', description: 'Instagram handle or profile URL (usuario o perfil de Instagram)' },
          whatsapp:         { type: 'string', description: 'WhatsApp phone number (número de WhatsApp con código de país)' },
          secondary_phone:  { type: 'string', description: 'Secondary phone number (teléfono secundario / alternativo)' },
          job_title:        { type: 'string', description: 'Contact job title / position (cargo del contacto, e.g. CEO, Director, Gerente)' },
          pain_points:      { type: 'string', description: 'Semicolon-separated pain points (notas de dolor / puntos de dolor; stored as cx_pain_points in HubSpot)' },
          pci:              { type: 'number', description: 'Prospect-Customer Index score 1-100 (puntuación PCI; stored as cx_pci in HubSpot)' },
          source:           { type: 'string', description: 'Lead source / acquisition channel (fuente de captura, e.g. organic, referral, paid, partner, event, website)' },
          status:           { type: 'string', enum: ['new', 'attempted_to_contact', 'in_progress', 'open', 'unqualified', 'bad_timing'], description: 'Lead/contact status (estado del lead; maps to HubSpot lead status)' }        },
        required: ['email']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'crm_contact_get',
      description:
        'Retrieve a contact from HubSpot by email or contact_id, including custom CX properties. ' +
        'Use BEFORE outreach to read the contact\'s pain points, PCI score, and other context. ' +
        'Returns contact properties or { status: "not_found" } if the contact does not exist.',
      parameters: {
        type: 'object',
        properties: {
          email:      { type: 'string', description: 'Contact email address (used as lookup key if contact_id not provided)' },
          contact_id: { type: 'string', description: 'HubSpot contact ID (preferred over email for lookup)' }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'acq_lead_score',
      description:
        'Score an incoming lead using rule-based logic and apply CRM tags. ' +
        'IMPORTANT: Before calling this tool, first create or update the contact via crm_contact_upsert ' +
        'to ensure all fields (company, phone, address, etc.) are saved in HubSpot. ' +
        'This tool only captures 6 fields — crm_contact_upsert captures 22. ' +
        'Use when a new lead signal is received and needs qualification.',
      parameters: {
        type: 'object',
        properties: {
          contact_id: { type: 'string', description: 'HubSpot contact ID' },
          email:      { type: 'string', description: 'Contact email address' },
          source:     {
            type: 'string',
            enum: ['organic', 'referral', 'paid', 'unknown', 'partner', 'event', 'website', 'cold_call', 'other'],
            description: 'Lead acquisition source (fuente de captura)'
          },
          company:  { type: 'string', description: 'Company name (empresa)' },
          phone:    { type: 'string', description: 'Contact phone number (teléfono)' },
          industry: { type: 'string', description: 'Industry (industria / giro)' }
        },
        required: ['contact_id', 'email', 'source']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'acq_contact_outreach',
      description:
        'Send cold outreach to a prospect via WhatsApp and email, and sync to HubSpot. ' +
        'Use when you have a qualified lead that needs initial contact. ' +
        'Requires HITL — the operator will review and may edit the message before sending.',
      parameters: {
        type: 'object',
        properties: {
          contact_id: { type: 'string', description: 'HubSpot contact ID (from crm_contact_upsert)' },
          email:      { type: 'string', description: 'Contact email address' },
          phone:      { type: 'string', description: 'Contact phone/WhatsApp number' },
          message:    { type: 'string', description: 'Personalized outreach message based on the lead pain signals' },
          company:    { type: 'string', description: 'Company name' },
          pain_signals: { type: 'string', description: 'Key pain points identified from lead data' }
        },
        required: ['contact_id', 'email', 'message']
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
  // Phase 3 — ONB (Onboarding) tools
  // ---------------------------------------------------------------------------
  {
    type: 'function',
    function: {
      name: 'onb_contact_nudge',
      description:
        'Send a re-engagement nudge to a contact who has stalled in onboarding. ' +
        'Use when signal_id is ONB_FRC_01 (abandoned setup) OR ONB_CLR_01 (confused about next steps), ' +
        'signal_severity >= 0.6. Do not use if the contact has already received a nudge in the last 48 hours.',
      parameters: {
        type: 'object',
        properties: {
          contact_id:    { type: 'string', description: 'CRM contact ID' },
          signal_id:     { type: 'string', description: 'Compass signal ID (ONB_FRC_01 or ONB_CLR_01)' },
          cause_code:    { type: 'string', description: 'Compass cause code (ONB-FRC or ONB-CLR)' },
          interventions: {
            type: 'array',
            items: { type: 'string' },
            description: 'Compass intervention IDs to apply'
          }
        },
        required: ['contact_id', 'signal_id', 'cause_code', 'interventions']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'onb_contact_assist',
      description:
        'Offer direct CSM white-glove assistance to a contact blocked in onboarding. ' +
        'Use when signal_id is ONB_FRC_02 (complaints about effort) OR ONB_CAP_01 (unable to complete setup), ' +
        'signal_severity >= 0.6. Prefer over nudge when signal_severity >= 0.8 or contact has already received a nudge. ' +
        'Requires HITL — routes through human approval before sending.',
      parameters: {
        type: 'object',
        properties: {
          contact_id:      { type: 'string', description: 'CRM contact ID' },
          signal_id:       { type: 'string', description: 'Compass signal ID (ONB_FRC_02 or ONB_CAP_01)' },
          signal_severity: { type: 'number', description: 'Signal severity 0–1 from Compass' }
        },
        required: ['contact_id', 'signal_id', 'signal_severity']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'onb_ticket_escalate',
      description:
        'Escalate a technical onboarding blocker to the support queue in HubSpot. ' +
        'Use when signal_id is ONB_CAP_02 (technical blockers), signal_severity >= 0.6.',
      parameters: {
        type: 'object',
        properties: {
          contact_id:           { type: 'string', description: 'CRM contact ID' },
          signal_id:            { type: 'string', description: 'Compass signal ID (ONB_CAP_02)' },
          signal_severity:      { type: 'number', description: 'Signal severity 0–1 from Compass' },
          blocker_description:  { type: 'string', description: 'Description of the technical blocker from payload' }
        },
        required: ['contact_id', 'signal_id', 'signal_severity', 'blocker_description']
      }
    }
  },

  // ---------------------------------------------------------------------------
  // Phase 3 — PRD (Product) tools
  // ---------------------------------------------------------------------------
  {
    type: 'function',
    function: {
      name: 'prd_contact_nudge',
      description:
        'Send an adoption nudge to a contact showing low product engagement. ' +
        'Use when signal_id is PRD_FRC_01 (task abandonment) OR PRD_FRC_02 (low usage of core features), ' +
        'signal_severity >= 0.7. Note: PRD_FRC_02 has critical severity (0.9) — always act on this signal.',
      parameters: {
        type: 'object',
        properties: {
          contact_id:    { type: 'string', description: 'CRM contact ID' },
          signal_id:     { type: 'string', description: 'Compass signal ID (PRD_FRC_01 or PRD_FRC_02)' },
          cause_code:    { type: 'string', description: 'Compass cause code (PRD-FRC)' },
          interventions: {
            type: 'array',
            items: { type: 'string' },
            description: 'Compass intervention IDs to apply'
          }
        },
        required: ['contact_id', 'signal_id', 'cause_code', 'interventions']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'prd_contact_educate',
      description:
        'Send a targeted feature education message to a contact using workarounds instead of native features. ' +
        'Use when signal_id is PRD_CAP_01 (workarounds used), signal_severity >= 0.6.',
      parameters: {
        type: 'object',
        properties: {
          contact_id:    { type: 'string', description: 'CRM contact ID' },
          signal_id:     { type: 'string', description: 'Compass signal ID (PRD_CAP_01)' },
          feature_area:  { type: 'string', description: 'Product feature area the contact is working around' }
        },
        required: ['contact_id', 'signal_id', 'feature_area']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'prd_feedback_log',
      description:
        'Log an enriched feature request signal to the product feedback pipeline in HubSpot. ' +
        'Use when signal_id is PRD_CAP_02 (feature requests), signal_severity >= 0.7. ' +
        'No contact-facing action — this is a logging operation only.',
      parameters: {
        type: 'object',
        properties: {
          contact_id:      { type: 'string', description: 'CRM contact ID' },
          signal_id:       { type: 'string', description: 'Compass signal ID (PRD_CAP_02)' },
          signal_severity: { type: 'number', description: 'Signal severity 0–1 from Compass' },
          feature_request: { type: 'string', description: 'Feature request description from payload' },
          interventions:   {
            type: 'array',
            items: { type: 'string' },
            description: 'Compass intervention IDs'
          }
        },
        required: ['contact_id', 'signal_id', 'signal_severity', 'feature_request', 'interventions']
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
  },

  // ---------------------------------------------------------------------------
  // Phase 3 B3 — Compass context retrieval (read-only, MCP routed)
  // ---------------------------------------------------------------------------
  {
    type: 'function',
    function: {
      name: 'compass_get_signal',
      description:
        'Look up a Compass signal by ID to retrieve its severity, cause, indicators, and available interventions. ' +
        'Use when you need to reason about which intervention to recommend for a specific signal. ' +
        'Read-only — does not dispatch to filter.',
      parameters: {
        type: 'object',
        properties: {
          signal_id: { type: 'string', description: 'Compass signal ID, e.g. PRD_FRC_02' }
        },
        required: ['signal_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'compass_get_interventions',
      description:
        'Get the three intervention options (A/B/C) for a Compass signal. ' +
        'Option A is typically the quick win, B is mid-level investment, C is strategic. ' +
        'Use to inform which action payload to send. ' +
        'Read-only — does not dispatch to filter.',
      parameters: {
        type: 'object',
        properties: {
          signal_id: { type: 'string', description: 'Compass signal ID' }
        },
        required: ['signal_id']
      }
    }
  },

  // ---------------------------------------------------------------------------
  // Phase 3 B3 — PostHog context retrieval (read-only, MCP routed)
  // requires posthog_distinct_id = contact_id mapping to be configured
  // ---------------------------------------------------------------------------
  {
    type: 'function',
    function: {
      name: 'posthog_get_contact_events',
      description:
        'Retrieve recent PostHog events for a contact to confirm or contextualize a Compass signal. ' +
        'Use before acting on PRD or ONB signals to verify live usage data. ' +
        'Read-only — does not dispatch to filter. ' +
        'NOTE: Requires PostHog distinct_id = contact_id mapping to be configured.',
      parameters: {
        type: 'object',
        properties: {
          contact_id:  { type: 'string', description: 'Contact ID (maps to PostHog distinct_id)' },
          event_names: {
            type: 'array',
            items: { type: 'string' },
            description: 'Specific PostHog events to query, e.g. ["feature_used", "task_abandoned"]'
          },
          days: { type: 'number', description: 'Lookback window in days, default 30' }
        },
        required: ['contact_id', 'event_names']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'posthog_get_feature_adoption',
      description:
        'Get feature adoption metrics for a contact. ' +
        'Maps to PRD_FRC indicators (feature_adoption_rate). ' +
        'Use when signal_id is PRD_FRC_01 or PRD_FRC_02 to verify signal before acting. ' +
        'Read-only — does not dispatch to filter. ' +
        'NOTE: Requires PostHog distinct_id = contact_id mapping to be configured.',
      parameters: {
        type: 'object',
        properties: {
          contact_id:    { type: 'string', description: 'Contact ID (maps to PostHog distinct_id)' },
          feature_names: {
            type: 'array',
            items: { type: 'string' },
            description: 'Feature names to check adoption for'
          }
        },
        required: ['contact_id', 'feature_names']
      }
    }
  }
];

// Map from LLM function name → filter action_id + stage
// null = handled locally (reply) or routed to MCP client (context retrieval tools)
export const TOOL_TO_ACTION: Record<string, { action_id: string; stage: string } | null> = {
  crm_contact_upsert:     { action_id: 'acq.contact.upsert',     stage: 'ACQ' },
  crm_contact_get:        { action_id: 'acq.contact.get',        stage: 'ACQ' },
  acq_lead_score:         { action_id: 'acq.lead.score',        stage: 'ACQ' },
  acq_contact_outreach:   { action_id: 'acq.contact.outreach',  stage: 'ACQ' },
  sal_sequence_enroll:    { action_id: 'sal.sequence.enroll',    stage: 'SAL' },
  sal_contact_prioritize: { action_id: 'sal.contact.prioritize', stage: 'SAL' },

  // Phase 2 — SUP + RET
  sup_ticket_escalate:    { action_id: 'sup.ticket.escalate',    stage: 'SUP' },
  sup_contact_notify:     { action_id: 'sup.contact.notify',     stage: 'SUP' },
  ret_contact_winback:    { action_id: 'ret.contact.winback',    stage: 'RET' },
  ret_account_flag:       { action_id: 'ret.account.flag',       stage: 'RET' },

  // Phase 3 — ONB + PRD
  onb_contact_nudge:      { action_id: 'onb.contact.nudge',      stage: 'ONB' },
  onb_contact_assist:     { action_id: 'onb.contact.assist',     stage: 'ONB' },
  onb_ticket_escalate:    { action_id: 'onb.ticket.escalate',    stage: 'ONB' },
  prd_contact_nudge:      { action_id: 'prd.adoption.nudge',      stage: 'PRD' },
  prd_contact_educate:    { action_id: 'prd.contact.educate',    stage: 'PRD' },
  prd_feedback_log:       { action_id: 'prd.feedback.log',       stage: 'PRD' },

  // Local handler — not dispatched to filter
  reply:                  null,

  // Phase 3 B3 — Compass context retrieval (MCP routed, not filter dispatched)
  compass_get_signal:           null,
  compass_get_interventions:    null,

  // Phase 3 B3 — PostHog context retrieval (MCP routed, optional)
  // requires posthog_distinct_id = contact_id mapping to be configured
  posthog_get_contact_events:   null,
  posthog_get_feature_adoption: null,

  // Phase 3 C3 — Engram contact memory (MCP routed)
};

