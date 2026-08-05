// ==============================================================================
// Exnoria · Cognitive · Session Logger
// Writes cognitive_session and cognitive_history rows to Postgres.
// Called by every specialist after a reasoning cycle completes.
// ==============================================================================
import { Pool } from "pg";
import { CXEvent } from "../shared/types";
import { FilterResponse } from "../agent/dispatch";
import { createLogger } from "../../../shared/logging";

const logger = createLogger("memory-session", "cognitive");

export interface ActionRecord {
  action_id: string;
  status: FilterResponse["status"];
  log_id?: string | null;
}

/**
 * Persist one complete reasoning cycle to Postgres.
 * Called fire-and-forget — failures are logged but never re-thrown.
 */
export async function logSessionToDb(
  db: Pool,
  session_id: string,
  event: CXEvent,
  model: string,
  actionsTaken: ActionRecord[],
  botReply?: string
): Promise<void> {
  try {
    // 1. Insert the session record
    await db.query(
      `INSERT INTO cognitive_session
         (id, contact_id, channel, stage, input, actions_taken, model, signal_id, signal_severity, cause_code)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10)
       ON CONFLICT (id) DO NOTHING`,
      [
        session_id,
        event.contact_id,
        event.channel ?? "internal",
        event.stage ?? null,
        event.input ?? "(no input)",
        JSON.stringify(actionsTaken),
        model,
        event.signal_id ?? null,
        event.signal_severity ?? null,
        event.cause_code ?? null,
      ]
    );

    // 2. Write user turn to cognitive_history
    if (event.input) {
      await db.query(
        `INSERT INTO cognitive_history
           (contact_id, channel, role, content, stage, session_id)
         VALUES ($1, $2, 'user', $3, $4, $5)`,
        [
          event.contact_id,
          event.channel ?? "internal",
          event.input,
          event.stage ?? null,
          session_id,
        ]
      );
    }

    // 3. Write assistant reply to cognitive_history (if any)
    if (botReply) {
      await db.query(
        `INSERT INTO cognitive_history
           (contact_id, channel, role, content, stage, session_id)
         VALUES ($1, $2, 'assistant', $3, $4, $5)`,
        [event.contact_id, event.channel ?? "internal", botReply, event.stage ?? null, session_id]
      );
    }

    logger.debug({ session_id }, "Session logged to Postgres");
  } catch (err) {
    // Never block the reasoning flow on DB write errors
    logger.error({ err, session_id }, "Failed to log session to DB");
  }
}
