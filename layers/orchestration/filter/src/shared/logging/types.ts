// ==============================================================================
// Exnoria · Shared logging types and constants
// For use across cognitive, filter, and dashboard layers
// ==============================================================================

export const SERVICES = ["cognitive", "filter", "dashboard"] as const;
export type Service = (typeof SERVICES)[number];

export type JourneyStage = "ACQ" | "SAL" | "ONB" | "PRD" | "SUP" | "COM" | "RET" | "EXP";

export interface StructuredLogContext {
  contact_id?: string; // sanitized format: contact:hash
  session_id?: string; // sanitized format: session:hash
  action_id?: string;
  stage?: JourneyStage;
  filter_log_id?: string;
  request_id?: string; // for cross-service tracing
  duration?: number; // milliseconds
}

export const LOGGING_DEFAULTS = {
  LEVEL: "info",
  PRETTY: false,
  REDACTION_MODE: "hash", // hash | mask | none
} as const;

export const PII_FIELD_PATTERNS = [
  // Direct identifiers
  /^(email|phone|name|firstname|lastname|company|contact_name)$/i,
  // Token/secret patterns
  /^(api_key|token|password|key|secret|authorization|.*_token|.*_key|.*_secret)$/i,
  // Message content with potential PII
  /^(whatsapp_message|message|content|input)$/i,
];
