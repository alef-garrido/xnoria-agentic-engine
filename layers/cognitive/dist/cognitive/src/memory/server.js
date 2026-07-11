"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = startServer;
// ==============================================================================
// Exnoria · Cognitive layer · Memory search HTTP endpoint
// Minimal Express server for dashboard API proxy
// ==============================================================================
const express_1 = __importDefault(require("express"));
const pg_1 = require("pg");
const child_process_1 = require("child_process");
const logging_1 = require("../../../shared/logging");
const logger = (0, logging_1.createLogger)('memory-server', 'cognitive');
const app = (0, express_1.default)();
const port = parseInt(process.env.COGNITIVE_MEMORY_PORT ?? '0', 10);
app.use(express_1.default.json());
// DB connection pool (shared with main)
const db = new pg_1.Pool({
    connectionString: process.env.POSTGRES_URL,
    max: 5
});
// Memory search endpoint
app.get('/memory/search', (req, res) => {
    const { contact_id, stage } = req.query;
    if (!contact_id) {
        return res.status(400).json({
            error: 'MISSING_CONTACT_ID',
            message: 'Missing required parameter: contact_id'
        });
    }
    // Call engram CLI directly - search all projects, not just xnoria-project-specific
    const searchQuery = stage ? `${contact_id} | ${stage}` : contact_id;
    const engramSearch = `engram search "${searchQuery}"`;
    (0, child_process_1.exec)(engramSearch, { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
        if (error) {
            logger.error({ err: error.message }, 'Engram CLI search failed');
            return res.status(500).json({
                error: 'MEMORY_UNAVAILABLE',
                message: `Memory search failed: ${error.message}`
            });
        }
        // Convert stdout to string (exec may return Buffer)
        const output = typeof stdout === 'string' ? stdout : stdout.toString();
        // Parse engram CLI output
        // Output format: "Found X memories:" followed by entries
        // Extract memory entries from stdout
        const memories = parseEngramOutput(output);
        res.json({ memories });
    });
});
// Parse Engram CLI output into structured memory objects
function parseEngramOutput(output) {
    const memories = [];
    const lines = output.split('\n');
    // Engram output format:
    // 1. Header: "Found X memories:"
    // 2. Array line: "[1] #1 (manual) — TEST_CID_001 | ONB | ONB_FRC_01 → onb.contact.nudge [executed]"
    // 3. First content line: "    contact_id: TEST_CID_001" (4 spaces indent)
    // 4. Subsequent content lines: "stage: ONB" (NO indent!)
    // 5. Timestamp line: "    2026-04-10 21:07:41 | scope: project" (4 spaces, but should skip)
    let currentTitle = '';
    let currentContent = '';
    let inContentBlock = false;
    for (const line of lines) {
        // Check for array entry line: "[1] #1 (manual) — title"
        // Uses Unicode em dash (U+2014): —
        const arrayMatch = line.match(/^\[(\d+)\] #\d+.*\u2014 (.+)$/);
        if (arrayMatch) {
            // Save previous entry if exists
            if (currentTitle) {
                memories.push({
                    title: currentTitle,
                    content: currentContent.trim(),
                    created_at: new Date().toISOString()
                });
            }
            // Start new entry
            currentTitle = arrayMatch[2];
            currentContent = '';
            inContentBlock = true;
            continue;
        }
        // Check for content lines
        if (inContentBlock) {
            // Content lines can be:
            // - "    key: value" (first line with 4-space indent)
            // - "key: value" (subsequent lines, NO indent)
            // Skip timestamp lines
            const trimmed = line.trim();
            // Check if this is a timestamp line: "    YYYY-MM-DD HH:MM:SS | scope: project"
            if (trimmed.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)) {
                continue;
            }
            // Not a timestamp, add to content
            if (trimmed) {
                currentContent += trimmed + '\n';
            }
        }
    }
    // Save last entry if exists
    if (currentTitle) {
        memories.push({
            title: currentTitle,
            content: currentContent.trim(),
            created_at: new Date().toISOString()
        });
    }
    return memories;
}
// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'exnoria-cognitive-memory' });
});
// Export start function for integration with main server
function startServer(db) {
    if (port <= 0) {
        logger.info('Memory search endpoint disabled (COGNITIVE_MEMORY_PORT not set)');
        return;
    }
    logger.info({ port, service: 'memory-search' }, 'Starting memory search endpoint');
    // Connect to Postgres
    db.connect().then(() => {
        logger.info('Connected to Postgres');
        // Start HTTP server
        app.listen(port, () => {
            logger.info({ port }, 'Memory search endpoint running');
        });
    }).catch((err) => {
        logger.error({ err }, 'Failed to initialize memory server');
        process.exit(1);
    });
    // Graceful shutdown
    const cleanup = async () => {
        logger.info('Shutting down memory server');
        await db.end();
        process.exit(0);
    };
    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);
}
