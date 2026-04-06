import express, { Request, Response } from 'express';
import { Pool } from 'pg';
import { lookupAction } from './allowlist/allowlist';
import { dispatchToN8n } from './execution/dispatch';
import { writeLog } from './audit/log';
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

// ------------------------------------------------------------------------------
// POST /filter/execute
// The single entry point for all cognitive layer action requests
// ------------------------------------------------------------------------------
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

  // 2. HITL gate — queue and return pending (no HITL logic in MVP, flag only)
  if (action.requires_hitl) {
    const log_id = await writeLog(db, {
      action_id:  body.action_id,
      stage:      body.stage,
      session_id: body.session_id,
      status:     'pending_hitl',
      payload_in: body.payload,
      meta:       body.meta ?? {}
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
