"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readHistory = readHistory;
exports.writeHistory = writeHistory;
const HISTORY_LIMIT = 20;
async function readHistory(db, contact_id) {
    const result = await db.query(`SELECT role, content, stage, created_at
     FROM cognitive_history
     WHERE contact_id = $1
     ORDER BY created_at DESC
     LIMIT $2`, [contact_id, HISTORY_LIMIT]);
    return result.rows.reverse().map(r => ({
        role: r.role,
        content: r.content,
        stage: r.stage ?? undefined,
        created_at: r.created_at
    }));
}
async function writeHistory(db, contact_id, channel, role, content, session_id, stage) {
    await db.query(`INSERT INTO cognitive_history
       (contact_id, channel, role, content, stage, session_id)
     VALUES ($1, $2, $3, $4, $5, $6)`, [contact_id, channel, role, content, stage ?? null, session_id]);
}
