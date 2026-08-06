// ==============================================================================
// Exnoria · Shared structured logging module
// Central location for Pino configuration and PII sanitization
// Import from: layers/cognitive, layers/filter, layers/dashboard
// ==============================================================================
import { createHash } from "crypto";
import pino, { Logger } from "pino";
import { hostname } from "os";
import { Service, PII_FIELD_PATTERNS, JourneyStage, LOGGING_DEFAULTS } from "./types";

// Production environment guard
if (process.env.NODE_ENV === "production" && process.env.LOG_REDACTION_MODE === "none") {
  throw new Error("LOG_REDACTION_MODE=none is not permitted in production");
}

/**
 * Hash an identifier for log correlation (not security)
 * Uses SHA256 truncated to 12 chars for 48 bits of entropy
 */
export function hashIdentifier(identifier: string): string {
  if (!identifier) return "[empty]";
  return createHash("sha256").update(identifier).digest("hex").slice(0, 12);
}

/**
 * Sanitize a PII field based on its type
 */
function sanitizeField(value: string, fieldName: string): string {
  if (typeof value !== "string") return "[REDACTED]";

  // Email masking
  if (fieldName.toLowerCase().includes("email") && value.includes("@")) {
    const [local, domain] = value.split("@");
    return `email:${"*".repeat(local.length)}@${domain}`;
  }

  // Phone masking (keep last 4 digits)
  if (fieldName.toLowerCase().includes("phone")) {
    const digits = value.replace(/\D/g, "");
    if (digits.length >= 4) {
      return `phone:${"*".repeat(digits.length - 4)}${digits.slice(-4)}`;
    }
    return "phone:[REDACTED]";
  }

  // WhatsApp message content - redact completely
  if (fieldName.toLowerCase() === "whatsapp_message") {
    return "whatsapp_message:[REDACTED_CONTENT]";
  }

  // Generic string redaction
  return `${fieldName}:[REDACTED]`;
}

/**
 * Sanitize object payload by redacting PII fields
 */
export function sanitizePayload(payload: unknown): unknown {
  if (!payload || typeof payload !== "object") return payload;

  const safePayload = { ...(payload as Record<string, unknown>) };

  for (const [key, value] of Object.entries(safePayload)) {
    // Check if field matches PII patterns
    const isPII = PII_FIELD_PATTERNS.some((pattern) => pattern.test(key));

    if (isPII && value !== null && value !== undefined) {
      safePayload[key] = typeof value === "string" ? sanitizeField(value, key) : "[REDACTED]";
    }
  }

  return safePayload;
}

/**
 * Custom serializers for Pino
 */
const serializers = {
  // Sanitize contact_id for correlation
  contact_id: (id: string) => `contact:${hashIdentifier(id)}`,

  // Sanitize session_id for correlation
  session_id: (id: string) => `session:${hashIdentifier(id)}`,

  // Sanitize payload objects
  payload: sanitizePayload,

  // Standard error serializer
  err: pino.stdSerializers.err,
};

/**
 * Create a logger instance for a specific module
 */
export function createLogger(module: string, service: Service = "cognitive"): Logger {
  return pino({
    // Level configuration
    level: process.env.LOG_LEVEL || LOGGING_DEFAULTS.LEVEL,

    // Basic metadata
    name: `${process.env.PROJECT_ID || "xnoria"}/${service}/${module}`,
    timestamp: pino.stdTimeFunctions.isoTime,

    // Custom serializers for PII protection
    serializers,

    // Structured format
    formatters: {
      level: (label: string) => ({ level: label }),
      bindings: () => ({
        pid: process.pid,
        hostname: hostname(),
        service,
        module,
      }),
    },

    // Development pretty printing
    transport:
      process.env.LOG_PRETTY === "true"
        ? {
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "SYS:standard",
              ignore: "pid,hostname,service,module",
            },
          }
        : undefined,
  });
}

/**
 * Helper for common log patterns
 */
export const logHelpers = {
  // Event processing with sanitized contact context
  eventProcessing: (event: { contact_id: string; stage?: JourneyStage }) => ({
    contact_id: event.contact_id,
    stage: event.stage,
  }),

  // Action dispatch with request tracing
  actionDispatch: (action_id: string, session_id: string) => ({
    action_id,
    session_id,
  }),

  // Error with context
  errorWithContext: (error: unknown, context: Record<string, unknown> = {}) => ({
    error: error instanceof Error ? error.message : String(error),
    ...context,
  }),
};
