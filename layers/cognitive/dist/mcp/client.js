"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initMcpClients = initMcpClients;
exports.executeMcpTool = executeMcpTool;
exports.isMcpTool = isMcpTool;
exports.shutdownMcpClients = shutdownMcpClients;
// ==============================================================================
// Exnoria · Cognitive · MCP Client
// Multi-transport dispatcher for context retrieval tools
//
// Three transport types:
//   - Compass: local stdio MCP process
//   - Engram:  local stdio MCP process (Phase 3 — contact memory)
//   - PostHog: external API via PostHog MCP server (optional — degrades gracefully)
// ==============================================================================
const index_js_1 = require("@modelcontextprotocol/sdk/client/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/client/stdio.js");
// ---------------------------------------------------------------------------
// Tool → server routing table
// ---------------------------------------------------------------------------
const TOOL_SERVER_MAP = {
    // Compass tools → local stdio
    compass_get_signal: 'compass',
    compass_get_interventions: 'compass',
    compass_get_cause: 'compass',
    compass_get_domain_signals: 'compass',
    compass_get_critical_signals: 'compass',
    // Engram tools → local stdio (Phase 3 C3 — contact memory)
    engram_search: 'engram',
    engram_add: 'engram',
    // PostHog tools → external API (optional)
    // requires posthog_distinct_id = contact_id mapping to be configured
    posthog_get_contact_events: 'posthog',
    posthog_get_feature_adoption: 'posthog',
};
const servers = new Map();
// ---------------------------------------------------------------------------
// Initialize all MCP server connections
// Call once at cognitive layer startup
// ---------------------------------------------------------------------------
async function initMcpClients() {
    // --- Compass: local stdio process ---
    try {
        const compassTransport = new stdio_js_1.StdioClientTransport({
            command: 'node',
            args: ['dist/mcp/compass-server.js']
        });
        const compassClient = new index_js_1.Client({ name: 'exnoria-cognitive', version: '1.0.0' });
        await compassClient.connect(compassTransport);
        servers.set('compass', { client: compassClient, connected: true, optional: false });
        console.log('[mcp-client] Compass MCP connected (stdio)');
    }
    catch (err) {
        console.error('[mcp-client] Compass MCP failed to connect:', err);
        throw err; // Compass is required — fail hard
    }
    // --- Engram: local stdio process (Phase 3 C3 — contact memory) ---
    try {
        const engramTransport = new stdio_js_1.StdioClientTransport({
            command: 'engram',
            args: ['mcp']
        });
        const engramClient = new index_js_1.Client({ name: 'exnoria-cognitive', version: '1.0.0' });
        await engramClient.connect(engramTransport);
        servers.set('engram', { client: engramClient, connected: true, optional: true });
        console.log('[mcp-client] Engram MCP connected (stdio)');
    }
    catch (err) {
        console.warn('[mcp-client] Engram MCP failed to connect (optional, continuing):', err);
        servers.set('engram', { client: null, connected: false, optional: true });
    }
    // --- PostHog: external API (optional — degrades gracefully) ---
    const posthogApiKey = process.env.POSTHOG_API_KEY;
    if (!posthogApiKey) {
        console.warn('[mcp-client] POSTHOG_API_KEY not set — PostHog tools disabled');
        servers.set('posthog', { client: null, connected: false, optional: true });
        return;
    }
    try {
        const posthogTransport = new stdio_js_1.StdioClientTransport({
            command: 'mcp-remote',
            args: [process.env.POSTHOG_HOST || 'https://app.posthog.com', '--header', `Authorization:Bearer ${posthogApiKey}`],
            env: {
                POSTHOG_API_KEY: posthogApiKey,
                POSTHOG_HOST: process.env.POSTHOG_HOST ?? 'https://app.posthog.com',
                POSTHOG_PROJECT_ID: process.env.POSTHOG_PROJECT_ID ?? '',
                ...process.env
            }
        });
        const posthogClient = new index_js_1.Client({ name: 'exnoria-cognitive', version: '1.0.0' });
        await posthogClient.connect(posthogTransport);
        servers.set('posthog', { client: posthogClient, connected: true, optional: true });
        console.log('[mcp-client] PostHog MCP connected (stdio)');
    }
    catch (err) {
        console.warn('[mcp-client] PostHog MCP failed to connect (optional, continuing):', err);
        servers.set('posthog', { client: null, connected: false, optional: true });
    }
}
async function executeMcpTool(toolName, args) {
    const serverName = TOOL_SERVER_MAP[toolName];
    if (!serverName) {
        return { success: false, content: '', error: `Unknown MCP tool: ${toolName}` };
    }
    const server = servers.get(serverName);
    if (!server) {
        return { success: false, content: '', error: `MCP server '${serverName}' not registered` };
    }
    if (!server.connected) {
        if (server.optional) {
            return {
                success: false,
                content: '',
                error: `MCP server '${serverName}' is not connected (optional — skipping)`
            };
        }
        return { success: false, content: '', error: `MCP server '${serverName}' is not connected` };
    }
    try {
        const result = await server.client.callTool({ name: toolName, arguments: args });
        // Extract text content from MCP response
        const textContent = result.content
            .filter(c => c.type === 'text')
            .map(c => c.text)
            .join('\n');
        return { success: true, content: textContent };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[mcp-client] Tool ${toolName} failed:`, message);
        return { success: false, content: '', error: message };
    }
}
// ---------------------------------------------------------------------------
// Check if a tool name is an MCP context retrieval tool
// ---------------------------------------------------------------------------
function isMcpTool(toolName) {
    return toolName in TOOL_SERVER_MAP;
}
// ---------------------------------------------------------------------------
// Shutdown all connections
// ---------------------------------------------------------------------------
async function shutdownMcpClients() {
    for (const [name, server] of servers) {
        if (server.connected) {
            try {
                await server.client.close();
                console.log(`[mcp-client] ${name} disconnected`);
            }
            catch (err) {
                console.warn(`[mcp-client] Error disconnecting ${name}:`, err);
            }
        }
    }
    servers.clear();
}
