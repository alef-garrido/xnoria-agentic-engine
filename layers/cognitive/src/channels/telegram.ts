// ==============================================================================
// Exnoria · Cognitive · Telegram channel adapter
// Bidirectional: receives messages → emits CXEvents, sends replies
// ==============================================================================
import TelegramBot from 'node-telegram-bot-api';
import { CXEvent } from '../shared/types';

let bot: TelegramBot | null = null;

// Active chat IDs — maps contact_id to Telegram chat ID for replies
const chatMap = new Map<string, number>();

export function initTelegram(
  onEvent: (event: CXEvent) => Promise<void>
): void {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn('[telegram] TELEGRAM_BOT_TOKEN not set — channel disabled');
    return;
  }

  bot = new TelegramBot(token, { polling: true });

  bot.on('message', async (msg) => {
    if (!msg.text) return;

    const chatId    = msg.chat.id;
    const contactId = `telegram:${chatId}`;

    // Store mapping for replies
    chatMap.set(contactId, chatId);

    console.log(`[telegram] Inbound from ${contactId}: ${msg.text}`);

    const event: CXEvent = {
      contact_id: contactId,
      channel:    'telegram',
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
      console.error('[telegram] Error processing event:', err);
      await sendReply(contactId, 'Sorry, something went wrong. Please try again.');
    }
  });

  bot.on('polling_error', (err) => {
    console.error('[telegram] Polling error:', err.message);
  });

  console.log('[telegram] Channel active — polling for messages');
}

export async function sendReply(
  contactId: string,
  message: string
): Promise<void> {
  if (!bot) return;

  const chatId = chatMap.get(contactId);
  if (!chatId) {
    console.warn(`[telegram] No chat ID found for contact ${contactId}`);
    return;
  }

  try {
    await bot.sendMessage(chatId, message);
    console.log(`[telegram] Reply sent to ${contactId}`);
  } catch (err) {
    console.error(`[telegram] Failed to send reply to ${contactId}:`, err);
  }
}
