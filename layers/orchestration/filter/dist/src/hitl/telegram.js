"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyOperator = notifyOperator;
// ==============================================================================
// Exnoria · Filter · Telegram operator notification
// Sends HITL alerts to the operator's Telegram chat
// Fire-and-forget: never blocks the filter response
// ==============================================================================
const axios_1 = __importDefault(require("axios"));
const logging_1 = require("../shared/logging");
const strings_1 = require("../i18n/strings");
const logger = (0, logging_1.createLogger)('filter-hitl-telegram', 'filter');
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OPERATOR_CHAT_ID = process.env.TELEGRAM_OPERATOR_CHAT_ID;
const DASHBOARD_URL = process.env.DASHBOARD_URL ?? 'http://localhost:4000';
/**
 * Send a Telegram notification to the operator when an action is queued for HITL.
 * Fire-and-forget — logs errors but never throws.
 *
 * ⚠️  DEV NOTE — Colisión de notificaciones en entorno local:
 * Existen DOS canales de Telegram independientes en la arquitectura:
 *   1. sendReply(contact_id, ...)  → Cognitive Layer → responde al *cliente*
 *   2. notifyOperator(...)         → Filter Service  → avisa al *operador* (este archivo)
 *
 * En producción son chats distintos (cliente vs. equipo de soporte).
 * En desarrollo local, si TELEGRAM_OPERATOR_CHAT_ID y el chat del contacto
 * apuntan al mismo chat personal del dev, recibirás DOS mensajes por acción HITL:
 *   - "✅ executed" / "⏳ pending approval" (del Cognitive, al cliente)
 *   - "⚠️ HITL Review Required" (del Filter, al operador)
 * Esto NO es un bug — es comportamiento correcto. Los dos mensajes coexisten.
 * Si probás con una acción sin HITL (requires_hitl=false), solo llegará el primero.
 */
async function notifyOperator(notification) {
    if (!TELEGRAM_BOT_TOKEN || !OPERATOR_CHAT_ID) {
        logger.warn('TELEGRAM_BOT_TOKEN or TELEGRAM_OPERATOR_CHAT_ID not set — skipping HITL notification');
        return;
    }
    const s = (0, strings_1.t)().hitl;
    const triggeredBy = notification.meta?.triggered_by
        ? `\n*${s.triggeredBy}:* ${notification.meta.triggered_by}`
        : '';
    const contactId = notification.payload?.contact_id ?? 'Unknown';
    const reason = notification.payload?.reason ?? '';
    const hubspotLink = contactId !== 'Unknown'
        ? `\n👉 [${s.hubspotLink}](https://app.hubspot.com/contacts/${process.env.HUBSPORT_PORTAL_ID ?? '51103874'}/contact/${contactId})`
        : '';
    let message;
    if (notification.manual_action) {
        message = [
            s.manualTitle,
            '',
            `*${s.action}:* \`${notification.action_id}\``,
            `*${s.stage}:* ${notification.stage}`,
            `*${s.contact}:* ${contactId}`,
            `*${s.session}:* \`${notification.session_id.substring(0, 12)}…\``,
            reason ? `*${s.reason}:* ${reason}` : '',
            triggeredBy,
            '',
            `*${s.whatToDo}*`,
            s.completeManually,
            hubspotLink,
            `👉 [${s.markAsDone}](${DASHBOARD_URL}/hitl)`
        ].filter(Boolean).join('\n');
    }
    else {
        message = [
            s.reviewTitle,
            '',
            `*${s.action}:* \`${notification.action_id}\``,
            `*${s.stage}:* ${notification.stage}`,
            `*${s.contact}:* ${contactId}`,
            `*${s.session}:* \`${notification.session_id.substring(0, 12)}…\``,
            reason ? `*${s.reason}:* ${reason}` : '',
            triggeredBy,
            '',
            `👉 [${s.reviewApprove}](${DASHBOARD_URL}/hitl)`
        ].filter(Boolean).join('\n');
    }
    try {
        await axios_1.default.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: OPERATOR_CHAT_ID,
            text: message,
            parse_mode: 'Markdown',
            disable_web_page_preview: true
        }, { timeout: 10000 });
        logger.info({ action_id: notification.action_id }, 'HITL notification sent');
    }
    catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Unknown error';
        logger.error({ err: errMsg, action_id: notification.action_id }, 'HITL notification failed');
        // Never throw — notification is best-effort
    }
}
