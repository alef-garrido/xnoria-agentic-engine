import express, { Request, Response } from 'express';
import { Pool } from 'pg';
import { lookupAction, listActions, createAction, updateAction, deleteAction } from './allowlist/allowlist';
import { dispatchToN8n } from './execution/dispatch';
import { writeLog } from './audit/log';
import { getPendingActions, approveAction, rejectAction } from './hitl/hitl';
import { notifyOperator } from './hitl/telegram';
import { FilterRequest, FilterResponse } from './shared/types';
import { createLogger } from './shared/logging';

const logger = createLogger('filter', 'filter');

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

    logger.info(
      { action_id: body.action_id, stage: body.stage, session_id: body.session_id,
        rejection_code: rejectionCode, log_id },
      'filter: action rejected'
    );

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

    logger.info(
      { action_id: body.action_id, stage: body.stage, session_id: body.session_id,
        log_id, requires_hitl: true },
      'filter: action queued for HITL'
    );

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
      { ...body.payload, session_id: body.session_id }
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

    logger.info(
      { action_id: body.action_id, stage: body.stage, session_id: body.session_id,
        log_id, result_keys: Object.keys(workflow_result ?? {}) },
      'filter: action executed'
    );

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
    logger.error({ err: message, endpoint: 'GET /filter/hitl/pending' }, 'HITL pending fetch failed');
    return res.status(500).json({ error: 'Failed to fetch pending actions', message });
  }
});

// POST /filter/hitl/:log_id/approve — approve a pending HITL action
// Optional body: { payload: { ... } } — overrides the AI-proposed payload
app.post('/filter/hitl/:log_id/approve', async (req: Request, res: Response) => {
  const { log_id } = req.params;
  const payloadOverride = req.body?.payload as Record<string, unknown> | undefined;

  try {
    const result = await approveAction(db, log_id, 'admin', undefined, payloadOverride);

    if (!result.success) {
      const statusCode = result.status === 'not_found' ? 404 : 400;
      return res.status(statusCode).json(result);
    }

    return res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ err: message, log_id, endpoint: 'POST /filter/hitl/approve' }, 'HITL approve failed');
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
    logger.error({ err: message, log_id, endpoint: 'POST /filter/hitl/reject' }, 'HITL reject failed');
    return res.status(500).json({ error: 'Failed to reject action', message });
  }
});

// ==============================================================================
// Health Metrics API (Phase 2)
// ==============================================================================

// GET /filter/health — aggregated per-stage metrics from filter_log
app.get('/filter/health', async (req: Request, res: Response) => {
  const days = parseInt(req.query.days as string) || 30;

  try {
    const result = await db.query(`
      WITH period_logs AS (
        SELECT *
        FROM filter_log
        WHERE created_at >= now() - make_interval(days => $1)
      ),
      stage_stats AS (
        SELECT
          stage,
          COUNT(*)::int                                              AS total_actions,
          COUNT(*) FILTER (WHERE status = 'executed')::int           AS executed,
          COUNT(*) FILTER (WHERE status = 'rejected')::int           AS rejected,
          COUNT(*) FILTER (WHERE status = 'pending_hitl')::int       AS pending_hitl,
          -- HITL metrics (actions that went through HITL flow)
          COUNT(*) FILTER (WHERE status IN ('pending_hitl', 'executed', 'rejected')
                            AND reviewed_at IS NOT NULL)::int        AS hitl_total,
          COUNT(*) FILTER (WHERE status = 'executed'
                            AND reviewed_at IS NOT NULL)::int        AS hitl_approved,
          COUNT(*) FILTER (WHERE status = 'rejected'
                            AND rejection_code = 'HITL_REJECTED')::int AS hitl_rejected,
          -- Average review time in minutes
          AVG(
            EXTRACT(EPOCH FROM (reviewed_at - created_at)) / 60.0
          ) FILTER (WHERE reviewed_at IS NOT NULL)                   AS avg_review_minutes
        FROM period_logs
        GROUP BY stage
      ),
      top_rejections AS (
        SELECT DISTINCT ON (stage)
          stage,
          rejection_code
        FROM period_logs
        WHERE rejection_code IS NOT NULL
        GROUP BY stage, rejection_code
        ORDER BY stage, COUNT(*) DESC
      )
      SELECT
        s.stage,
        s.total_actions,
        s.executed,
        s.rejected,
        s.pending_hitl,
        CASE WHEN s.total_actions > 0
          THEN ROUND(s.executed::numeric / s.total_actions, 4)
          ELSE 0 END                                                 AS execution_rate,
        s.hitl_total,
        s.hitl_approved,
        s.hitl_rejected,
        CASE WHEN s.hitl_total > 0
          THEN ROUND(s.hitl_approved::numeric / s.hitl_total, 4)
          ELSE 0 END                                                 AS hitl_approval_rate,
        ROUND(s.avg_review_minutes::numeric, 1)                      AS avg_review_minutes,
        t.rejection_code                                             AS top_rejection_code
      FROM stage_stats s
      LEFT JOIN top_rejections t ON t.stage = s.stage
      ORDER BY s.stage;
    `, [days]);

    const metrics = result.rows.map((row: any) => ({
      stage:              row.stage,
      period_days:        days,
      total_actions:      row.total_actions,
      executed:           row.executed,
      rejected:           row.rejected,
      pending_hitl:       row.pending_hitl,
      execution_rate:     parseFloat(row.execution_rate),
      hitl_total:         row.hitl_total,
      hitl_approved:      row.hitl_approved,
      hitl_rejected:      row.hitl_rejected,
      hitl_approval_rate: parseFloat(row.hitl_approval_rate),
      avg_review_minutes: row.avg_review_minutes ? parseFloat(row.avg_review_minutes) : null,
      top_rejection_code: row.top_rejection_code ?? null
    }));

    return res.json({ metrics, period_days: days });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ err: message, endpoint: 'GET /filter/health' }, 'Health metrics computation failed');
    return res.status(500).json({ error: 'Failed to compute health metrics', message });
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
    logger.error({ err: message, endpoint: 'GET /filter/allowlist' }, 'List actions failed');
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
    logger.error({ err: message, action_id, endpoint: 'POST /filter/allowlist' }, 'Create action failed');
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
    logger.error({ err: message, action_id: id, endpoint: 'PATCH /filter/allowlist' }, 'Update action failed');
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
    logger.error({ err: message, action_id: id, endpoint: 'DELETE /filter/allowlist' }, 'Delete action failed');
    return res.status(500).json({ error: 'Failed to delete action', message });
  }
});

// ------------------------------------------------------------------------------
// Start
// ------------------------------------------------------------------------------
db.connect()
  .then(() => {
    logger.info({ service: 'filter' }, 'Connected to Postgres');
    app.listen(port, () => {
      logger.info({ port, service: 'filter' }, 'Filter service ready');

      // Startup validation: DASHBOARD_URL debe ser resoluble externamente en producción
      const dashboardUrl = process.env.DASHBOARD_URL ?? 'http://localhost:4000';
      const isLocal = dashboardUrl.includes('localhost') || dashboardUrl.includes('127.0.0.1');
      if (isLocal && process.env.NODE_ENV !== 'development') {
        logger.warn(
          { dashboard_url: dashboardUrl },
          'DASHBOARD_URL apunta a localhost — los links de HITL en Telegram no funcionarán desde dispositivos externos. Seteá DASHBOARD_URL a un dominio o IP resoluble públicamente.'
        );
      }
    });
  })
  .catch((err: unknown) => {
    logger.error({ err }, 'Failed to connect to Postgres — exiting');
    process.exit(1);
  });
