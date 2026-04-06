// ==============================================================================
// Exnoria · Cognitive · Event loop
// Receives CXEvents from all channels and routes them to the reasoning agent
// ==============================================================================
import { Pool }         from 'pg';
import { reason }       from '../agent/reason';
import { sendReply }    from '../channels/telegram';
import { CXEvent }      from '../shared/types';

export function createEventLoop(db: Pool) {
  // Process a single inbound event through the reasoning cycle
  async function processEvent(event: CXEvent): Promise<void> {
    try {
      const result = await reason(db, event);

      // Route reply back through the originating channel
      if (result.reply) {
        switch (event.channel) {
          case 'telegram':
            await sendReply(event.contact_id, result.reply);
            break;
          case 'n8n':
          case 'internal':
            console.log(`[loop] Reply (${event.channel}): ${result.reply}`);
            break;
        }
      }

      console.log(
        `[loop] Session ${result.session_id} complete — ` +
        `${result.actions_taken.length} action(s) dispatched`
      );
    } catch (err) {
      console.error('[loop] Error in reasoning cycle:', err);
    }
  }

  return { processEvent };
}
