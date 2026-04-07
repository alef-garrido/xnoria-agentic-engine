// ==============================================================================
// Exnoria · Filter · Telegram operator notification
// Sends HITL alerts to the operator's Telegram chat
// Fire-and-forget: never blocks the filter response
// ==============================================================================
import axios from 'axios';

const TELEGRAM_BOT_TOKEN    = process.env.TELEGRAM_BOT_TOKEN;
const OPERATOR_CHAT_ID      = process.env.TELEGRAM_OPERATOR_CHAT_ID;
const DASHBOARD_URL         = process.env.DASHBOARD_URL ?? 'http://localhost:4000';

interface HITLNotification {
  action_id:  string;
  stage:      string;
  session_id: string;
  payload:    Record<string, unknown>;
  meta?:      Record<string, unknown>;
}

/**
 * Send a Telegram notification to the operator when an action is queued for HITL.
 * Fire-and-forget — logs errors but never throws.
 */
export async function notifyOperator(notification: HITLNotification): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN || !OPERATOR_CHAT_ID) {
    console.warn('[filter/telegram] TELEGRAM_BOT_TOKEN or TELEGRAM_OPERATOR_CHAT_ID not set — skipping notification');
    return;
  }

  const triggeredBy = notification.meta?.triggered_by
    ? `\nTriggered: ${notification.meta.triggered_by}`
    : '';

  const contactId = notification.payload?.contact_id ?? 'Unknown';
  const reason    = notification.payload?.reason ?? '';

  const message = [
    '⚠️ *HITL Review Required*',
    '',
    `*Action:* \`${notification.action_id}\``,
    `*Stage:* ${notification.stage}`,
    `*Contact:* ${contactId}`,
    `*Session:* \`${notification.session_id.substring(0, 12)}…\``,
    reason ? `*Reason:* ${reason}` : '',
    triggeredBy,
    '',
    `👉 [Review & Approve](${DASHBOARD_URL}/hitl)`
  ].filter(Boolean).join('\n');

  try {
    await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: OPERATOR_CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      },
      { timeout: 10_000 }
    );
    console.log(`[filter/telegram] HITL notification sent for ${notification.action_id}`);
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[filter/telegram] Failed to send notification: ${errMsg}`);
    // Never throw — notification is best-effort
  }
}
