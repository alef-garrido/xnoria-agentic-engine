"use strict";
// ==============================================================================
// Exnoria · Shared logging types and constants
// For use across cognitive, filter, and dashboard layers
// ==============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.PII_FIELD_PATTERNS = exports.LOGGING_DEFAULTS = exports.SERVICES = void 0;
exports.SERVICES = ['cognitive', 'filter', 'dashboard'];
exports.LOGGING_DEFAULTS = {
    LEVEL: 'info',
    PRETTY: false,
    REDACTION_MODE: 'hash' // hash | mask | none
};
exports.PII_FIELD_PATTERNS = [
    // Direct identifiers
    /^(email|phone|name|firstname|lastname|company|contact_name)$/i,
    // Token/secret patterns  
    /^(api_key|token|password|key|secret|authorization|.*_token|.*_key|.*_secret)$/i,
    // Message content with potential PII
    /^(whatsapp_message|message|content|input)$/i
];
