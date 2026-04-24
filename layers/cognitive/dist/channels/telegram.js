"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initTelegram = initTelegram;
exports.sendReply = sendReply;
// ==============================================================================
// Exnoria · Cognitive · Telegram channel adapter
// Bidirectional: receives messages → emits CXEvents, sends replies
// ==============================================================================
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
let bot = null;
// Active chat IDs — maps contact_id to Telegram chat ID for replies
const chatMap = new Map();
// Stage detection from natural language messages
// Explicit acronyms take priority; semantic patterns cover natural operator speech
const STAGE_PATTERNS = [
    // --- Explicit acronyms (priority) ---
    { pattern: /\bACQ(?:uisition)?\b/i, stage: 'ACQ' },
    { pattern: /\bSAL(?:es)?\b/i, stage: 'SAL' },
    { pattern: /\bONB(?:oarding)?\b/i, stage: 'ONB' },
    { pattern: /\bPRD(?:uct)?\b/i, stage: 'PRD' },
    { pattern: /\bSUP(?:port)?\b/i, stage: 'SUP' },
    { pattern: /(?<![.@])\bCOM\b/i, stage: 'COM' },
    { pattern: /\bRET(?:ention)?\b/i, stage: 'RET' },
    { pattern: /\bEXP(?:ansion)?\b/i, stage: 'EXP' },
    // --- Semantic / natural language (operator speech) ---
    { pattern: /\b(?:lead|inbound|entrante|prospect)\b/i, stage: 'ACQ' },
    { pattern: /\b(?:prioridad|prioritize|prioritise|dar.prioridad|follow.up|sales|vendedor)\b/i, stage: 'SAL' },
    { pattern: /\b(?:onboard|bienvenida|configurar.cuenta|setup|getting.started)\b/i, stage: 'ONB' },
    { pattern: /\b(?:soporte|support.ticket|bug|problema|issue|incidencia)\b/i, stage: 'SUP' },
    { pattern: /\b(?:churn|cancelar|cancelaci[oó]n|winback|retener|retention)\b/i, stage: 'RET' },
    { pattern: /\b(?:upsell|expansion|expansi[oó]n|cuenta.premium|upgrade)\b/i, stage: 'EXP' },
    { pattern: /\b(?:contenido|publicar|newsletter|redes.sociales|social.media)\b/i, stage: 'COM' },
    { pattern: /\b(?:friccion|friction|adopci[oó]n|adoption|feature.request|funcionalidad)\b/i, stage: 'PRD' },
];
function extractStage(text) {
    for (const { pattern, stage } of STAGE_PATTERNS) {
        if (pattern.test(text)) {
            return stage;
        }
    }
    return undefined;
}
function initTelegram(onEvent) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
        console.warn('[telegram] TELEGRAM_BOT_TOKEN not set — channel disabled');
        return;
    }
    bot = new node_telegram_bot_api_1.default(token, { polling: true });
    bot.on('message', async (msg) => {
        if (!msg.text)
            return;
        const chatId = msg.chat.id;
        const contactId = `telegram:${chatId}`;
        // Store mapping for replies
        chatMap.set(contactId, chatId);
        console.log(`[telegram] Inbound from ${contactId}: ${msg.text}`);
        const stage = extractStage(msg.text);
        const event = {
            contact_id: contactId,
            channel: 'telegram',
            stage, // May be undefined for non-structured messages
            input: msg.text,
            meta: {
                chat_id: chatId,
                username: msg.from?.username,
                first_name: msg.from?.first_name
            }
        };
        try {
            await onEvent(event);
        }
        catch (err) {
            console.error('[telegram] Error processing event:', err);
            await sendReply(contactId, 'Sorry, something went wrong. Please try again.');
        }
    });
    bot.on('polling_error', (err) => {
        console.error('[telegram] Polling error:', err.message);
    });
    console.log('[telegram] Channel active — polling for messages');
}
async function sendReply(contactId, message) {
    if (!bot)
        return;
    const chatId = chatMap.get(contactId);
    if (!chatId) {
        console.warn(`[telegram] No chat ID found for contact ${contactId}`);
        return;
    }
    try {
        await bot.sendMessage(chatId, message);
        console.log(`[telegram] Reply sent to ${contactId}`);
    }
    catch (err) {
        console.error(`[telegram] Failed to send reply to ${contactId}:`, err);
    }
}
