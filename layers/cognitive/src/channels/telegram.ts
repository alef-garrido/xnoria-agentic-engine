// ==============================================================================
// Exnoria · Cognitive · Telegram channel adapter
// Bidirectional: receives messages → emits CXEvents, sends replies
// ==============================================================================
import TelegramBot from 'node-telegram-bot-api';
import { CXEvent, JourneyStage } from '../shared/types';
import { createLogger } from '../../../shared/logging';

const logger = createLogger('telegram', 'cognitive');

let bot: TelegramBot | null = null;

// Active chat IDs — maps contact_id to Telegram chat ID for replies
const chatMap = new Map<string, number>();

// Stage detection from natural language messages
// Explicit acronyms take priority; semantic patterns cover natural operator speech
const STAGE_PATTERNS: Array<{ pattern: RegExp; stage: JourneyStage }> = [
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

function extractStage(text: string): JourneyStage | undefined {
  for (const { pattern, stage } of STAGE_PATTERNS) {
    if (pattern.test(text)) {
      logger.debug({ stage }, 'Stage detected from message pattern');
      return stage;
    }
  }
  logger.debug('No stage detected — coordinator will handle fallback');
  return undefined;
}

export function initTelegram(
  onEvent: (event: CXEvent) => Promise<void>
): void {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    logger.warn('TELEGRAM_BOT_TOKEN not set — channel disabled');
    return;
  }

  bot = new TelegramBot(token, { polling: true });

  bot.on('message', async (msg) => {
    if (!msg.text) return;

    const chatId    = msg.chat.id;
    const contactId = `telegram:${chatId}`;

    // Store mapping for replies
    chatMap.set(contactId, chatId);

    // Log inbound at debug only — message content is PII
    logger.debug({ contact_id: contactId }, 'Inbound message received');

    const stage = extractStage(msg.text);

    const event: CXEvent = {
      contact_id: contactId,
      channel:    'telegram',
      stage,      // May be undefined for non-structured messages
      input:      msg.text,
      meta: {
        chat_id:    chatId,
        username:   msg.from?.username,
        first_name: msg.from?.first_name
      }
    };

    try {
      await onEvent(event);
    } catch (err) {
      logger.error({ err, contact_id: contactId }, 'Error processing event');
      await sendReply(contactId, 'Sorry, something went wrong. Please try again.');
    }
  });

  bot.on('polling_error', (err) => {
    logger.error({ err: err.message }, 'Telegram polling error');
  });

  logger.info('Channel active — polling for messages');
}

export async function sendReply(
  contactId: string,
  message: string
): Promise<void> {
  if (!bot) return;

  const chatId = chatMap.get(contactId);
  if (!chatId) {
    logger.warn({ contact_id: contactId }, 'No chat ID found for contact — reply dropped');
    return;
  }

  try {
    await bot.sendMessage(chatId, message);
    logger.debug({ contact_id: contactId }, 'Reply sent');
  } catch (err) {
    logger.error({ err, contact_id: contactId }, 'Failed to send reply');
  }
}
