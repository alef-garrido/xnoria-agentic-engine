// ==============================================================================
// Exnoria · Cognitive · Memory — recent history
// Reads and writes the last N conversation turns per contact
// ==============================================================================
import { Pool } from "pg";
import { HistoryTurn, Role, JourneyStage } from "../shared/types";

const HISTORY_LIMIT = 20;

export async function readHistory(db: Pool, contact_id: string): Promise<HistoryTurn[]> {
  const result = await db.query<{
    role: Role;
    content: string;
    stage: JourneyStage | null;
    created_at: Date;
  }>(
    `SELECT role, content, stage, created_at
     FROM cognitive_history
     WHERE contact_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [contact_id, HISTORY_LIMIT]
  );
  return result.rows.reverse().map((r) => ({
    role: r.role,
    content: r.content,
    stage: r.stage ?? undefined,
    created_at: r.created_at,
  }));
}

export async function writeHistory(
  db: Pool,
  contact_id: string,
  channel: string,
  role: Role,
  content: string,
  session_id: string,
  stage?: JourneyStage
): Promise<void> {
  await db.query(
    `INSERT INTO cognitive_history
       (contact_id, channel, role, content, stage, session_id)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [contact_id, channel, role, content, stage ?? null, session_id]
  );
}
