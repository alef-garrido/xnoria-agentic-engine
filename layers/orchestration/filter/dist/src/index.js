"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pg_1 = require("pg");
const allowlist_1 = require("./allowlist/allowlist");
const dispatch_1 = require("./execution/dispatch");
const log_1 = require("./audit/log");
const hitl_1 = require("./hitl/hitl");
const telegram_1 = require("./hitl/telegram");
const logging_1 = require("./shared/logging");
const strings_1 = require("./i18n/strings");
const logger = (0, logging_1.createLogger)('filter', 'filter');
const app = (0, express_1.default)();
const port = parseInt(process.env.FILTER_PORT ?? '3000', 10);
app.use(express_1.default.json());
// ------------------------------------------------------------------------------
// DB connection pool
// ------------------------------------------------------------------------------
const db = new pg_1.Pool({
    connectionString: process.env.POSTGRES_URL,
    max: 10
});
// ------------------------------------------------------------------------------
// Health check
// ------------------------------------------------------------------------------
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: `${process.env.PROJECT_ID || 'xnoria'}-filter` });
});
// ==============================================================================
// POST /filter/execute
// The single entry point for all cognitive layer action requests
// ==============================================================================
app.post('/filter/execute', async (req, res) => {
    const body = req.body;
    // Validate required fields
    if (!body.action_id || !body.stage || !body.session_id || !body.payload) {
        return res.status(400).json({
            status: 'error',
            error_code: 'PAYLOAD_INVALID',
            message: (0, strings_1.t)().api.payloadInvalid
        });
    }
    // 1. Allowlist check
    const { action, rejectionCode, rejectionReason } = await (0, allowlist_1.lookupAction)(db, body.action_id, body.stage);
    if (!action) {
        const log_id = await (0, log_1.writeLog)(db, {
            action_id: body.action_id,
            stage: body.stage,
            session_id: body.session_id,
            status: 'rejected',
            rejection_code: rejectionCode,
            rejection_reason: rejectionReason,
            payload_in: body.payload,
            meta: body.meta ?? {}
        });
        logger.info({ action_id: body.action_id, stage: body.stage, session_id: body.session_id,
            rejection_code: rejectionCode, log_id }, 'filter: action rejected');
        return res.status(403).json({
            status: 'rejected',
            log_id,
            rejection_code: rejectionCode ?? undefined,
            message: rejectionReason ?? undefined
        });
    }
    // 2. HITL gate — queue, notify operator, and return pending
    if (action.requires_hitl) {
        const log_id = await (0, log_1.writeLog)(db, {
            action_id: body.action_id,
            stage: body.stage,
            session_id: body.session_id,
            status: 'pending_hitl',
            payload_in: body.payload,
            meta: body.meta ?? {}
        });
        // Fire-and-forget Telegram notification
        (0, telegram_1.notifyOperator)({
            action_id: body.action_id,
            stage: body.stage,
            session_id: body.session_id,
            payload: body.payload,
            meta: body.meta,
            manual_action: action.manual_action
        });
        logger.info({ action_id: body.action_id, stage: body.stage, session_id: body.session_id,
            log_id, requires_hitl: true }, 'filter: action queued for HITL');
        return res.status(202).json({
            status: 'pending_hitl',
            log_id,
            queue_id: log_id,
            message: (0, strings_1.t)().api.actionQueuedForHitl
        });
    }
    // 3. Dispatch to n8n
    try {
        const workflow_result = await (0, dispatch_1.dispatchToN8n)(action.n8n_workflow_id, { ...body.payload, session_id: body.session_id });
        const log_id = await (0, log_1.writeLog)(db, {
            action_id: body.action_id,
            stage: body.stage,
            session_id: body.session_id,
            status: 'executed',
            payload_in: body.payload,
            payload_out: workflow_result,
            meta: body.meta ?? {}
        });
        logger.info({ action_id: body.action_id, stage: body.stage, session_id: body.session_id,
            log_id, result_keys: Object.keys(workflow_result ?? {}) }, 'filter: action executed');
        return res.status(200).json({
            status: 'executed',
            log_id,
            workflow_result
        });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown dispatch error';
        const log_id = await (0, log_1.writeLog)(db, {
            action_id: body.action_id,
            stage: body.stage,
            session_id: body.session_id,
            status: 'error',
            rejection_code: 'WORKFLOW_UNREACHABLE',
            rejection_reason: message,
            payload_in: body.payload,
            meta: body.meta ?? {}
        });
        return res.status(502).json({
            status: 'error',
            log_id,
            error_code: 'WORKFLOW_UNREACHABLE',
            message
        });
    }
});
// ==============================================================================
// HITL Queue API
// ==============================================================================
// GET /filter/hitl/pending — list all pending HITL actions
app.get('/filter/hitl/pending', async (_req, res) => {
    try {
        const pending = await (0, hitl_1.getPendingActions)(db);
        return res.json({ pending, count: pending.length });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        logger.error({ err: message, endpoint: 'GET /filter/hitl/pending' }, 'HITL pending fetch failed');
        return res.status(500).json({ error: (0, strings_1.t)().api.pendingFetchFailed, message });
    }
});
// POST /filter/hitl/:log_id/approve — approve a pending HITL action
// Optional body: { payload: { ... } } — overrides the AI-proposed payload
app.post('/filter/hitl/:log_id/approve', async (req, res) => {
    const { log_id } = req.params;
    const payloadOverride = req.body?.payload;
    try {
        const result = await (0, hitl_1.approveAction)(db, log_id, 'admin', undefined, payloadOverride);
        if (!result.success) {
            const statusCode = result.status === 'not_found' ? 404 : 400;
            return res.status(statusCode).json(result);
        }
        return res.json(result);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        logger.error({ err: message, log_id, endpoint: 'POST /filter/hitl/approve' }, 'HITL approve failed');
        return res.status(500).json({ error: 'Failed to approve action', message });
    }
});
// POST /filter/hitl/:log_id/reject — reject a pending HITL action
app.post('/filter/hitl/:log_id/reject', async (req, res) => {
    const { log_id } = req.params;
    try {
        const result = await (0, hitl_1.rejectAction)(db, log_id, 'admin');
        if (!result.success) {
            const statusCode = result.status === 'not_found' ? 404 : 400;
            return res.status(statusCode).json(result);
        }
        return res.json(result);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        logger.error({ err: message, log_id, endpoint: 'POST /filter/hitl/reject' }, 'HITL reject failed');
        return res.status(500).json({ error: 'Failed to reject action', message });
    }
});
// ==============================================================================
// Health Metrics API (Phase 2)
// ==============================================================================
// GET /filter/health — aggregated per-stage metrics from filter_log
app.get('/filter/health', async (req, res) => {
    const days = parseInt(req.query.days) || 30;
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
        const metrics = result.rows.map((row) => ({
            stage: row.stage,
            period_days: days,
            total_actions: row.total_actions,
            executed: row.executed,
            rejected: row.rejected,
            pending_hitl: row.pending_hitl,
            execution_rate: parseFloat(row.execution_rate),
            hitl_total: row.hitl_total,
            hitl_approved: row.hitl_approved,
            hitl_rejected: row.hitl_rejected,
            hitl_approval_rate: parseFloat(row.hitl_approval_rate),
            avg_review_minutes: row.avg_review_minutes ? parseFloat(row.avg_review_minutes) : null,
            top_rejection_code: row.top_rejection_code ?? null
        }));
        return res.json({ metrics, period_days: days });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        logger.error({ err: message, endpoint: 'GET /filter/health' }, 'Health metrics computation failed');
        return res.status(500).json({ error: 'Failed to compute health metrics', message });
    }
});
// ==============================================================================
// Allowlist CRUD API
// ==============================================================================
// GET /filter/allowlist — list all registered actions
app.get('/filter/allowlist', async (_req, res) => {
    try {
        const actions = await (0, allowlist_1.listActions)(db);
        return res.json({ actions, count: actions.length });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        logger.error({ err: message, endpoint: 'GET /filter/allowlist' }, 'List actions failed');
        return res.status(500).json({ error: 'Failed to list actions', message });
    }
});
// POST /filter/allowlist — create a new action
app.post('/filter/allowlist', async (req, res) => {
    const { action_id, stage, n8n_workflow_id, requires_hitl, manual_action, enabled, description, description_es } = req.body;
    if (!action_id || !stage || !n8n_workflow_id) {
        return res.status(400).json({
            error: 'Missing required fields: action_id, stage, n8n_workflow_id'
        });
    }
    try {
        const action = await (0, allowlist_1.createAction)(db, {
            action_id, stage, n8n_workflow_id, requires_hitl, manual_action, enabled, description, description_es
        });
        return res.status(201).json({ action });
    }
    catch (err) {
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
app.patch('/filter/allowlist/:id', async (req, res) => {
    const { id } = req.params;
    const { requires_hitl, manual_action, enabled, description, description_es, n8n_workflow_id } = req.body;
    try {
        const action = await (0, allowlist_1.updateAction)(db, id, {
            requires_hitl, manual_action, enabled, description, description_es, n8n_workflow_id
        });
        if (!action) {
            return res.status(404).json({ error: 'Action not found' });
        }
        return res.json({ action });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        logger.error({ err: message, action_id: id, endpoint: 'PATCH /filter/allowlist' }, 'Update action failed');
        return res.status(500).json({ error: 'Failed to update action', message });
    }
});
// DELETE /filter/allowlist/:id — remove an action
app.delete('/filter/allowlist/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const deleted = await (0, allowlist_1.deleteAction)(db, id);
        if (!deleted) {
            return res.status(404).json({ error: 'Action not found' });
        }
        return res.json({ deleted: true, id });
    }
    catch (err) {
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
            logger.warn({ dashboard_url: dashboardUrl }, 'DASHBOARD_URL apunta a localhost — los links de HITL en Telegram no funcionarán desde dispositivos externos. Seteá DASHBOARD_URL a un dominio o IP resoluble públicamente.');
        }
    });
})
    .catch((err) => {
    logger.error({ err }, 'Failed to connect to Postgres — exiting');
    process.exit(1);
});
