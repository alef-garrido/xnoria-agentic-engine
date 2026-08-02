"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logHelpers = void 0;
exports.hashIdentifier = hashIdentifier;
exports.sanitizePayload = sanitizePayload;
exports.createLogger = createLogger;
// ==============================================================================
// Exnoria · Shared structured logging module
// Central location for Pino configuration and PII sanitization
// Import from: layers/cognitive, layers/filter, layers/dashboard
// ==============================================================================
const crypto_1 = require("crypto");
const pino_1 = __importDefault(require("pino"));
const os_1 = require("os");
const types_1 = require("./types");
// Production environment guard
if (process.env.NODE_ENV === 'production' && process.env.LOG_REDACTION_MODE === 'none') {
    throw new Error('LOG_REDACTION_MODE=none is not permitted in production');
}
/**
 * Hash an identifier for log correlation (not security)
 * Uses SHA256 truncated to 12 chars for 48 bits of entropy
 */
function hashIdentifier(identifier) {
    if (!identifier)
        return '[empty]';
    return (0, crypto_1.createHash)('sha256').update(identifier).digest('hex').slice(0, 12);
}
/**
 * Sanitize a PII field based on its type
 */
function sanitizeField(value, fieldName) {
    if (typeof value !== 'string')
        return '[REDACTED]';
    // Email masking
    if (fieldName.toLowerCase().includes('email') && value.includes('@')) {
        const [local, domain] = value.split('@');
        return `email:${'*'.repeat(local.length)}@${domain}`;
    }
    // Phone masking (keep last 4 digits)
    if (fieldName.toLowerCase().includes('phone')) {
        const digits = value.replace(/\D/g, '');
        if (digits.length >= 4) {
            return `phone:${'*'.repeat(digits.length - 4)}${digits.slice(-4)}`;
        }
        return 'phone:[REDACTED]';
    }
    // WhatsApp message content - redact completely
    if (fieldName.toLowerCase() === 'whatsapp_message') {
        return 'whatsapp_message:[REDACTED_CONTENT]';
    }
    // Generic string redaction
    return `${fieldName}:[REDACTED]`;
}
/**
 * Sanitize object payload by redacting PII fields
 */
function sanitizePayload(payload) {
    if (!payload || typeof payload !== 'object')
        return payload;
    const safePayload = { ...payload };
    for (const [key, value] of Object.entries(safePayload)) {
        // Check if field matches PII patterns
        const isPII = types_1.PII_FIELD_PATTERNS.some(pattern => pattern.test(key));
        if (isPII && value !== null && value !== undefined) {
            safePayload[key] = typeof value === 'string'
                ? sanitizeField(value, key)
                : '[REDACTED]';
        }
    }
    return safePayload;
}
/**
 * Custom serializers for Pino
 */
const serializers = {
    // Sanitize contact_id for correlation
    contact_id: (id) => `contact:${hashIdentifier(id)}`,
    // Sanitize session_id for correlation  
    session_id: (id) => `session:${hashIdentifier(id)}`,
    // Sanitize payload objects
    payload: sanitizePayload,
    // Standard error serializer
    err: pino_1.default.stdSerializers.err,
};
/**
 * Create a logger instance for a specific module
 */
function createLogger(module, service = 'cognitive') {
    return (0, pino_1.default)({
        // Level configuration
        level: process.env.LOG_LEVEL || types_1.LOGGING_DEFAULTS.LEVEL,
        // Basic metadata
        name: `${process.env.PROJECT_ID || 'xnoria'}/${service}/${module}`,
        timestamp: pino_1.default.stdTimeFunctions.isoTime,
        // Custom serializers for PII protection
        serializers,
        // Structured format
        formatters: {
            level: (label) => ({ level: label }),
            bindings: () => ({
                pid: process.pid,
                hostname: (0, os_1.hostname)(),
                service,
                module
            })
        },
        // Development pretty printing
        transport: process.env.LOG_PRETTY === 'true' ? {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname,service,module'
            }
        } : undefined
    });
}
/**
 * Helper for common log patterns
 */
exports.logHelpers = {
    // Event processing with sanitized contact context
    eventProcessing: (event) => ({
        contact_id: event.contact_id,
        stage: event.stage
    }),
    // Action dispatch with request tracing
    actionDispatch: (action_id, session_id) => ({
        action_id,
        session_id
    }),
    // Error with context
    errorWithContext: (error, context = {}) => ({
        error: error instanceof Error ? error.message : String(error),
        ...context
    })
};
