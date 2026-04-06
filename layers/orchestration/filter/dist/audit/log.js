"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeLog = writeLog;
async function writeLog(db, entry) {
    const result = await db.query(`INSERT INTO filter_log
      (action_id, stage, session_id, status, rejection_code, rejection_reason,
       payload_in, payload_out, meta)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING id`, [
        entry.action_id,
        entry.stage,
        entry.session_id,
        entry.status,
        entry.rejection_code ?? null,
        entry.rejection_reason ?? null,
        JSON.stringify(entry.payload_in),
        JSON.stringify(entry.payload_out ?? {}),
        JSON.stringify(entry.meta ?? {})
    ]);
    return result.rows[0].id;
}
