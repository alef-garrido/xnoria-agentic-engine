// ==============================================================================
// Exnoria · Filter · HITL queue logic
// Handles pending action queries, approvals, and rejections
// ==============================================================================
import { Pool } from 'pg';
import { HITLPendingAction } from '../shared/types';
import { dispatchToN8n } from '../execution/dispatch';

// --------------------------------------------------------------------------
// List all pending HITL actions awaiting human approval
// --------------------------------------------------------------------------
export async function getPendingActions(db: Pool): Promise<HITLPendingAction[]> {
  const result = await db.query<{
    id: string;
    action_id: string;
    stage: string;
    session_id: string;
    payload_in: Record<string, unknown>;
    meta: Record<string, unknown>;
    created_at: string;
  }>(
    `SELECT id, action_id, stage, session_id, payload_in, meta, created_at
     FROM filter_log
     WHERE status = 'pending_hitl'
     ORDER BY created_at DESC`
  );

  return result.rows.map(row => ({
    log_id:     row.id,
    action_id:  row.action_id,
    stage:      row.stage,
    session_id: row.session_id,
    payload_in: row.payload_in,
    meta:       row.meta,
    created_at: row.created_at
  }));
}

// --------------------------------------------------------------------------
// Approve a pending HITL action — dispatches to n8n, updates status
// Idempotent: if already approved/executed, returns success without re-dispatching
// --------------------------------------------------------------------------
export async function approveAction(
  db: Pool,
  logId: string,
  reviewedBy: string = 'admin',
  operatorId?: string,
  payloadOverride?: Record<string, unknown>
): Promise<{ success: boolean; log_id: string; status: string; dispatched_at?: string; error?: string }> {

  // 1. Read the pending log entry
  const logResult = await db.query<{
    id: string;
    action_id: string;
    stage: string;
    session_id: string;
    status: string;
    payload_in: Record<string, unknown>;
    meta: Record<string, unknown>;
  }>(
    `SELECT id, action_id, stage, session_id, status, payload_in, meta
     FROM filter_log WHERE id = $1`,
    [logId]
  );

  if (logResult.rows.length === 0) {
    return { success: false, log_id: logId, status: 'not_found', error: 'Log entry not found' };
  }

  const entry = logResult.rows[0];

  // Idempotent: already approved/executed
  if (entry.status === 'executed') {
    return { success: true, log_id: logId, status: 'executed' };
  }

  // Can only approve pending_hitl entries
  if (entry.status !== 'pending_hitl') {
    return {
      success: false,
      log_id: logId,
      status: entry.status,
      error: `Cannot approve entry with status '${entry.status}'`
    };
  }

  // 2. Look up the action to get n8n_workflow_id
  const actionResult = await db.query<{ n8n_workflow_id: string }>(
    `SELECT n8n_workflow_id FROM filter_action WHERE action_id = $1 LIMIT 1`,
    [entry.action_id]
  );

  if (actionResult.rows.length === 0) {
    return {
      success: false,
      log_id: logId,
      status: 'error',
      error: `Action '${entry.action_id}' no longer exists in allowlist`
    };
  }

  // 3. Dispatch to n8n
  const now = new Date().toISOString();
  try {
    // 3. Dispatch to n8n — use operator-edited payload if provided
    const dispatchPayload = payloadOverride ?? entry.payload_in;
    const workflowResult = await dispatchToN8n(
      actionResult.rows[0].n8n_workflow_id,
      dispatchPayload
    );

    // 4. Update log: pending_hitl → executed
    await db.query(
      `UPDATE filter_log
       SET status = 'executed',
           payload_out              = $1,
           payload_reviewed         = $2,
           reviewed_at              = now(),
           reviewed_by              = $3,
           reviewed_by_operator_id  = $4
       WHERE id = $5`,
      [
        JSON.stringify(workflowResult),
        payloadOverride ? JSON.stringify(payloadOverride) : null,
        reviewedBy,
        operatorId ?? null,
        logId
      ]
    );

    return { success: true, log_id: logId, status: 'executed', dispatched_at: now };

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown dispatch error';

    // Update log with error status
    await db.query(
      `UPDATE filter_log
       SET status = 'error',
           rejection_code           = 'WORKFLOW_UNREACHABLE',
           rejection_reason         = $1,
           reviewed_at              = now(),
           reviewed_by              = $2,
           reviewed_by_operator_id  = $3
       WHERE id = $4`,
      [message, reviewedBy, operatorId ?? null, logId]
    );

    return { success: false, log_id: logId, status: 'error', error: message };
  }
}

// --------------------------------------------------------------------------
// Reject a pending HITL action — updates status, does NOT dispatch
// --------------------------------------------------------------------------
export async function rejectAction(
  db: Pool,
  logId: string,
  reviewedBy: string = 'admin',
  operatorId?: string
): Promise<{ success: boolean; log_id: string; status: string; rejected_at?: string; error?: string }> {

  // 1. Read the pending log entry
  const logResult = await db.query<{ id: string; status: string }>(
    `SELECT id, status FROM filter_log WHERE id = $1`,
    [logId]
  );

  if (logResult.rows.length === 0) {
    return { success: false, log_id: logId, status: 'not_found', error: 'Log entry not found' };
  }

  const entry = logResult.rows[0];

  // Idempotent: already rejected
  if (entry.status === 'rejected') {
    return { success: true, log_id: logId, status: 'rejected' };
  }

  // Can only reject pending_hitl entries
  if (entry.status !== 'pending_hitl') {
    return {
      success: false,
      log_id: logId,
      status: entry.status,
      error: `Cannot reject entry with status '${entry.status}'`
    };
  }

  // 2. Update log: pending_hitl → rejected
  const now = new Date().toISOString();
  await db.query(
    `UPDATE filter_log
     SET status = 'rejected',
         rejection_code           = 'HITL_REJECTED',
         rejection_reason         = 'Rejected by operator',
         reviewed_at              = now(),
         reviewed_by              = $1,
         reviewed_by_operator_id  = $2
     WHERE id = $3`,
    [reviewedBy, operatorId ?? null, logId]
  );

  return { success: true, log_id: logId, status: 'rejected', rejected_at: now };
}
