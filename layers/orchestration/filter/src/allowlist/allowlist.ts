import { Pool } from 'pg';
import { FilterAction, JourneyStage } from '../shared/types';

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
      rejectionReason: `action_id '${action_id}' is not registered in the allowlist`
    };
  }

  const action = result.rows[0];

  // Found but stage doesn't match
  if (action.stage !== stage) {
    return {
      action: null,
      rejectionCode: 'STAGE_MISMATCH',
      rejectionReason: `action_id '${action_id}' belongs to stage '${action.stage}', not '${stage}'`
    };
  }

  // Found but disabled
  if (!action.enabled) {
    return {
      action: null,
      rejectionCode: 'ACTION_DISABLED',
      rejectionReason: `action_id '${action_id}' is currently disabled`
    };
  }

  return { action, rejectionCode: null, rejectionReason: null };
}
