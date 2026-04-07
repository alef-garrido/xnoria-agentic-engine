import express, { Request, Response } from 'express';
import { Pool } from 'pg';
import { lookupAction, listActions, createAction, updateAction, deleteAction } from './allowlist/allowlist';
import { dispatchToN8n } from './execution/dispatch';
import { writeLog } from './audit/log';
import { getPendingActions, approveAction, rejectAction } from './hitl/hitl';
import { notifyOperator } from './hitl/telegram';
import { FilterRequest, FilterResponse } from './shared/types';

const app  = express();
const port = parseInt(process.env.FILTER_PORT ?? '3000', 10);

app.use(express.json());

// ------------------------------------------------------------------------------
// DB connection pool
// ------------------------------------------------------------------------------
const db = new Pool({
  connectionString: process.env.POSTGRES_URL,
  max: 10
});

// ------------------------------------------------------------------------------
// Health check
// ------------------------------------------------------------------------------
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'exnoria-filter' });
});

// ==============================================================================
// POST /filter/execute
// The single entry point for all cognitive layer action requests
// ==============================================================================
app.post('/filter/execute', async (req: Request, res: Response) => {
  const body = req.body as FilterRequest;

  // Validate required fields
  if (!body.action_id || !body.stage || !body.session_id || !body.payload) {
    return res.status(400).json({
      status: 'error',
      error_code: 'PAYLOAD_INVALID',
      message: 'Missing required fields: action_id, stage, session_id, payload'
    } satisfies Partial<FilterResponse>);
  }

  // 1. Allowlist check
  const { action, rejectionCode, rejectionReason } = await lookupAction(
    db,
    body.action_id,
    body.stage
  );

  if (!action) {
    const log_id = await writeLog(db, {
      action_id:        body.action_id,
      stage:            body.stage,
      session_id:       body.session_id,
      status:           'rejected',
      rejection_code:   rejectionCode!,
      rejection_reason: rejectionReason!,
      payload_in:       body.payload,
      meta:             body.meta ?? {}
    });

    return res.status(403).json({
      status:          'rejected',
      log_id,
      rejection_code:  (rejectionCode as any) ?? undefined,
      message:         rejectionReason ?? undefined
    } satisfies Partial<FilterResponse>);
  }

  // 2. HITL gate — queue, notify operator, and return pending
  if (action.requires_hitl) {
    const log_id = await writeLog(db, {
      action_id:  body.action_id,
      stage:      body.stage,
      session_id: body.session_id,
      status:     'pending_hitl',
      payload_in: body.payload,
      meta:       body.meta ?? {}
    });

    // Fire-and-forget Telegram notification
    notifyOperator({
      action_id:  body.action_id,
      stage:      body.stage,
      session_id: body.session_id,
      payload:    body.payload,
      meta:       body.meta
    });

    return res.status(202).json({
      status:    'pending_hitl',
      log_id,
      queue_id:  log_id,
      message:   'Action queued for human approval'
    } satisfies Partial<FilterResponse>);
  }

  // 3. Dispatch to n8n
  try {
    const workflow_result = await dispatchToN8n(
      action.n8n_workflow_id,
      body.payload
    );

    const log_id = await writeLog(db, {
      action_id:    body.action_id,
      stage:        body.stage,
      session_id:   body.session_id,
      status:       'executed',
      payload_in:   body.payload,
      payload_out:  workflow_result,
      meta:         body.meta ?? {}
    });

    return res.status(200).json({
      status: 'executed',
      log_id,
      workflow_result
    } satisfies Partial<FilterResponse>);

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown dispatch error';

    const log_id = await writeLog(db, {
      action_id:        body.action_id,
      stage:            body.stage,
      session_id:       body.session_id,
      status:           'error',
      rejection_code:   'WORKFLOW_UNREACHABLE',
      rejection_reason: message,
      payload_in:       body.payload,
      meta:             body.meta ?? {}
    });

    return res.status(502).json({
      status:     'error',
      log_id,
      error_code: 'WORKFLOW_UNREACHABLE',
      message
    } satisfies Partial<FilterResponse>);
  }
});

// ==============================================================================
// HITL Queue API
// ==============================================================================

// GET /filter/hitl/pending — list all pending HITL actions
app.get('/filter/hitl/pending', async (_req: Request, res: Response) => {
  try {
    const pending = await getPendingActions(db);
    return res.json({ pending, count: pending.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[filter] Failed to fetch HITL pending:', message);
    return res.status(500).json({ error: 'Failed to fetch pending actions', message });
  }
});

// POST /filter/hitl/:log_id/approve — approve a pending HITL action
app.post('/filter/hitl/:log_id/approve', async (req: Request, res: Response) => {
  const { log_id } = req.params;

  try {
    const result = await approveAction(db, log_id, 'admin');

    if (!result.success) {
      const statusCode = result.status === 'not_found' ? 404 : 400;
      return res.status(statusCode).json(result);
    }

    return res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[filter] Failed to approve HITL action:', message);
    return res.status(500).json({ error: 'Failed to approve action', message });
  }
});

// POST /filter/hitl/:log_id/reject — reject a pending HITL action
app.post('/filter/hitl/:log_id/reject', async (req: Request, res: Response) => {
  const { log_id } = req.params;

  try {
    const result = await rejectAction(db, log_id, 'admin');

    if (!result.success) {
      const statusCode = result.status === 'not_found' ? 404 : 400;
      return res.status(statusCode).json(result);
    }

    return res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[filter] Failed to reject HITL action:', message);
    return res.status(500).json({ error: 'Failed to reject action', message });
  }
});

// ==============================================================================
// Allowlist CRUD API
// ==============================================================================

// GET /filter/allowlist — list all registered actions
app.get('/filter/allowlist', async (_req: Request, res: Response) => {
  try {
    const actions = await listActions(db);
    return res.json({ actions, count: actions.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[filter] Failed to list actions:', message);
    return res.status(500).json({ error: 'Failed to list actions', message });
  }
});

// POST /filter/allowlist — create a new action
app.post('/filter/allowlist', async (req: Request, res: Response) => {
  const { action_id, stage, n8n_workflow_id, requires_hitl, enabled, description } = req.body;

  if (!action_id || !stage || !n8n_workflow_id) {
    return res.status(400).json({
      error: 'Missing required fields: action_id, stage, n8n_workflow_id'
    });
  }

  try {
    const action = await createAction(db, {
      action_id, stage, n8n_workflow_id, requires_hitl, enabled, description
    });
    return res.status(201).json({ action });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    // Handle unique constraint violation
    if (message.includes('duplicate key') || message.includes('unique')) {
      return res.status(409).json({ error: `Action '${action_id}' already exists` });
    }
    console.error('[filter] Failed to create action:', message);
    return res.status(500).json({ error: 'Failed to create action', message });
  }
});

// PATCH /filter/allowlist/:id — update an action
app.patch('/filter/allowlist/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { requires_hitl, enabled, description, n8n_workflow_id } = req.body;

  try {
    const action = await updateAction(db, id, {
      requires_hitl, enabled, description, n8n_workflow_id
    });

    if (!action) {
      return res.status(404).json({ error: 'Action not found' });
    }

    return res.json({ action });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[filter] Failed to update action:', message);
    return res.status(500).json({ error: 'Failed to update action', message });
  }
});

// DELETE /filter/allowlist/:id — remove an action
app.delete('/filter/allowlist/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const deleted = await deleteAction(db, id);

    if (!deleted) {
      return res.status(404).json({ error: 'Action not found' });
    }

    return res.json({ deleted: true, id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[filter] Failed to delete action:', message);
    return res.status(500).json({ error: 'Failed to delete action', message });
  }
});

// ------------------------------------------------------------------------------
// Start
// ------------------------------------------------------------------------------
db.connect()
  .then(() => {
    console.log('[filter] connected to postgres');
    app.listen(port, () => {
      console.log(`[filter] listening on port ${port}`);
    });
  })
  .catch((err: unknown) => {
    console.error('[filter] failed to connect to postgres:', err);
    process.exit(1);
  });
