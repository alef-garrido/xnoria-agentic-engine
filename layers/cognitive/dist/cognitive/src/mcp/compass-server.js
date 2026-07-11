"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ==============================================================================
// Exnoria · Cognitive · Compass MCP Server
// Exposes the Compass signal/intervention vocabulary as 5 MCP tools
// Runs as a local stdio MCP process alongside the cognitive layer
// ==============================================================================
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const compass_data_1 = require("./compass-data");
const server = new index_js_1.Server({ name: 'compass', version: '1.0.0' }, { capabilities: { tools: {} } });
// ---------------------------------------------------------------------------
// List tools
// ---------------------------------------------------------------------------
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => ({
    tools: [
        {
            name: 'compass_get_signal',
            description: 'Look up a Compass signal by ID. Returns severity, cause, indicators, and available interventions.',
            inputSchema: {
                type: 'object',
                properties: {
                    signal_id: { type: 'string', description: 'Compass signal ID, e.g. PRD_FRC_02' }
                },
                required: ['signal_id']
            }
        },
        {
            name: 'compass_get_interventions',
            description: 'Get the three intervention options (A/B/C) for a Compass signal.',
            inputSchema: {
                type: 'object',
                properties: {
                    signal_id: { type: 'string', description: 'Compass signal ID' }
                },
                required: ['signal_id']
            }
        },
        {
            name: 'compass_get_cause',
            description: 'Get all signals sharing a cause code across domains.',
            inputSchema: {
                type: 'object',
                properties: {
                    cause_code: { type: 'string', description: 'Compass cause code, e.g. PRD-FRC' }
                },
                required: ['cause_code']
            }
        },
        {
            name: 'compass_get_domain_signals',
            description: 'Get all signals for a journey stage/domain.',
            inputSchema: {
                type: 'object',
                properties: {
                    domain: { type: 'string', description: 'Journey stage: ACQ, SAL, ONB, PRD, SUP, COM, RET, EXP' }
                },
                required: ['domain']
            }
        },
        {
            name: 'compass_get_critical_signals',
            description: 'Get all signals above a severity threshold (default 0.7).',
            inputSchema: {
                type: 'object',
                properties: {
                    threshold: { type: 'number', description: 'Minimum severity, default 0.7' }
                }
            }
        },
    ]
}));
// ---------------------------------------------------------------------------
// Handle tool calls
// ---------------------------------------------------------------------------
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    switch (name) {
        case 'compass_get_signal': {
            const signal_id = args.signal_id;
            const signal = (0, compass_data_1.getSignal)(signal_id);
            if (!signal) {
                return { content: [{ type: 'text', text: JSON.stringify({ error: `Signal ${signal_id} not found` }) }] };
            }
            const interventions = (0, compass_data_1.getInterventions)(signal_id);
            const stageMeta = compass_data_1.STAGE_META[signal.domain];
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify({
                            ...signal,
                            stage_name: stageMeta.name,
                            interventions: interventions.map(i => ({
                                id: i.id, option: i.option, description: i.description, strategic_note: i.strategic_note
                            }))
                        }, null, 2)
                    }]
            };
        }
        case 'compass_get_interventions': {
            const signal_id = args.signal_id;
            const interventions = (0, compass_data_1.getInterventions)(signal_id);
            if (interventions.length === 0) {
                return { content: [{ type: 'text', text: JSON.stringify({ error: `No interventions for ${signal_id}` }) }] };
            }
            return { content: [{ type: 'text', text: JSON.stringify({ signal_id, interventions }, null, 2) }] };
        }
        case 'compass_get_cause': {
            const cause_code = args.cause_code;
            const signals = (0, compass_data_1.getSignalsByCause)(cause_code);
            return { content: [{ type: 'text', text: JSON.stringify({ cause_code, signal_count: signals.length, signals }, null, 2) }] };
        }
        case 'compass_get_domain_signals': {
            const domain = args.domain.toUpperCase();
            const signals = (0, compass_data_1.getSignalsByDomain)(domain);
            const meta = compass_data_1.STAGE_META[domain];
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify({
                            domain, stage_name: meta?.name ?? 'Unknown', signal_count: signals.length, signals
                        }, null, 2)
                    }]
            };
        }
        case 'compass_get_critical_signals': {
            const threshold = args.threshold ?? 0.7;
            const signals = (0, compass_data_1.getCriticalSignals)(threshold);
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify({
                            threshold, signal_count: signals.length,
                            signals: signals.map(s => ({ signal_id: s.signal_id, name: s.name, domain: s.domain, severity: s.severity }))
                        }, null, 2)
                    }]
            };
        }
        default:
            return { content: [{ type: 'text', text: JSON.stringify({ error: `Unknown tool: ${name}` }) }] };
    }
});
// ---------------------------------------------------------------------------
// Start server on stdio transport
// ---------------------------------------------------------------------------
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    // INTENTIONAL: compass-server is a stdio MCP process.
    // console.error → stderr only (safe). console.log/info would corrupt the MCP protocol stream.
    console.error('[compass-mcp] Compass MCP server running on stdio');
}
main().catch((err) => {
    // INTENTIONAL: Must use stderr here — stdout belongs to the MCP protocol.
    console.error('[compass-mcp] Fatal error:', err);
    process.exit(1);
});
