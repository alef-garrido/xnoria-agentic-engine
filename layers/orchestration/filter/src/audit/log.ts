import { Pool } from 'pg';
import { FilterStatus, RejectionCode } from '../shared/types';

export interface LogEntry {
  action_id:        string;
  stage:            string;
  session_id:       string;
  status:           FilterStatus;
  rejection_code?:  RejectionCode | string;
  rejection_reason?: string;
  payload_in:       Record<string, unknown>;
  payload_out?:     Record<string, unknown>;
  meta?:            Record<string, unknown>;
}

export async function writeLog(db: Pool, entry: LogEntry): Promise<string> {
  const result = await db.query<{ id: string }>(
    `INSERT INTO filter_log
      (action_id, stage, session_id, status, rejection_code, rejection_reason,
       payload_in, payload_out, meta)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING id`,
    [
      entry.action_id,
      entry.stage,
      entry.session_id,
      entry.status,
      entry.rejection_code  ?? null,
      entry.rejection_reason ?? null,
      JSON.stringify(entry.payload_in),
      JSON.stringify(entry.payload_out  ?? {}),
      JSON.stringify(entry.meta         ?? {})
    ]
  );
  return result.rows[0].id;
}
