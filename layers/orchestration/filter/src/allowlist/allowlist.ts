import { Pool } from 'pg';
import { FilterAction, JourneyStage } from '../shared/types';
import { t } from '../i18n/strings';

// --------------------------------------------------------------------------
// Lookup — used by POST /filter/execute on every request
// --------------------------------------------------------------------------
export async function lookupAction(
  db: Pool,
  action_id: string,
  stage: JourneyStage
): Promise<{ action: FilterAction | null; rejectionCode: string | null; rejectionReason: string | null }> {

  const result = await db.query<FilterAction>(
    `SELECT * FROM filter_action WHERE action_id = $1 LIMIT 1`,
    [action_id]
  );

  // Not found at all
  if (result.rows.length === 0) {
    return {
      action: null,
      rejectionCode: 'ACTION_NOT_IN_ALLOWLIST',
      rejectionReason: t().rejectionReasons.notInAllowlist(action_id)
    };
  }

  const action = result.rows[0];

  // Found but stage doesn't match
  if (action.stage !== stage) {
    return {
      action: null,
      rejectionCode: 'STAGE_MISMATCH',
      rejectionReason: t().rejectionReasons.stageMismatch(action_id, action.stage, stage)
    };
  }

  // Found but disabled
  if (!action.enabled) {
    return {
      action: null,
      rejectionCode: 'ACTION_DISABLED',
      rejectionReason: t().rejectionReasons.disabled(action_id)
    };
  }

  return { action, rejectionCode: null, rejectionReason: null };
}

// --------------------------------------------------------------------------
// CRUD — used by the allowlist manager dashboard
// --------------------------------------------------------------------------

export async function listActions(db: Pool): Promise<FilterAction[]> {
  const result = await db.query<FilterAction>(
    `SELECT id, action_id, stage, n8n_workflow_id, requires_hitl, manual_action, enabled, description, description_es, created_at, updated_at
     FROM filter_action
     ORDER BY stage ASC, action_id ASC`
  );
  return result.rows;
}

export interface CreateActionInput {
  action_id:       string;
  stage:           string;
  n8n_workflow_id: string;
  requires_hitl?:  boolean;
  manual_action?:  boolean;
  enabled?:        boolean;
  description?:    string;
  description_es?: string;
}

export async function createAction(db: Pool, input: CreateActionInput): Promise<FilterAction> {
  const result = await db.query<FilterAction>(
    `INSERT INTO filter_action (action_id, stage, n8n_workflow_id, requires_hitl, manual_action, enabled, description, description_es)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, action_id, stage, n8n_workflow_id, requires_hitl, manual_action, enabled, description, description_es, created_at, updated_at`,
    [
      input.action_id,
      input.stage,
      input.n8n_workflow_id,
      input.requires_hitl ?? false,
      input.manual_action ?? false,
      input.enabled ?? true,
      input.description ?? null,
      input.description_es ?? null
    ]
  );
  return result.rows[0];
}

export interface UpdateActionInput {
  requires_hitl?:  boolean;
  manual_action?:  boolean;
  enabled?:        boolean;
  description?:    string;
  description_es?: string;
  n8n_workflow_id?: string;
}

export async function updateAction(db: Pool, id: string, input: UpdateActionInput): Promise<FilterAction | null> {
  // Build dynamic SET clause from provided fields
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (input.requires_hitl !== undefined) {
    setClauses.push(`requires_hitl = $${paramIndex++}`);
    values.push(input.requires_hitl);
  }
  if (input.manual_action !== undefined) {
    setClauses.push(`manual_action = $${paramIndex++}`);
    values.push(input.manual_action);
  }
  if (input.enabled !== undefined) {
    setClauses.push(`enabled = $${paramIndex++}`);
    values.push(input.enabled);
  }
  if (input.description !== undefined) {
    setClauses.push(`description = $${paramIndex++}`);
    values.push(input.description);
  }
  if (input.description_es !== undefined) {
    setClauses.push(`description_es = $${paramIndex++}`);
    values.push(input.description_es);
  }
  if (input.n8n_workflow_id !== undefined) {
    setClauses.push(`n8n_workflow_id = $${paramIndex++}`);
    values.push(input.n8n_workflow_id);
  }

  if (setClauses.length === 0) {
    // Nothing to update — return current state
    const current = await db.query<FilterAction>(
      `SELECT id, action_id, stage, n8n_workflow_id, requires_hitl, manual_action, enabled, description, description_es, created_at, updated_at
       FROM filter_action WHERE id = $1`,
      [id]
    );
    return current.rows[0] ?? null;
  }

  values.push(id);
  const result = await db.query<FilterAction>(
    `UPDATE filter_action
     SET ${setClauses.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING id, action_id, stage, n8n_workflow_id, requires_hitl, manual_action, enabled, description, description_es, created_at, updated_at`,
    values
  );

  return result.rows[0] ?? null;
}

export async function deleteAction(db: Pool, id: string): Promise<boolean> {
  const result = await db.query(
    `DELETE FROM filter_action WHERE id = $1`,
    [id]
  );
  return (result.rowCount ?? 0) > 0;
}
