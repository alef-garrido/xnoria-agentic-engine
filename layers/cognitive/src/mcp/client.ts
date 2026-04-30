// ==============================================================================
// Exnoria · Cognitive · MCP Client
// Multi-transport dispatcher for context retrieval tools
//
// Three transport types:
//   - Compass: local stdio MCP process
//   - Engram:  local stdio MCP process (Phase 3 — contact memory)
//   - PostHog: external API via PostHog MCP server (optional — degrades gracefully)
// ==============================================================================
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { createLogger } from '../../../shared/logging';

const logger = createLogger('mcp-client', 'cognitive');

// ---------------------------------------------------------------------------
// Tool → server routing table
// ---------------------------------------------------------------------------
const TOOL_SERVER_MAP: Record<string, string> = {
  // Compass tools → local stdio
  compass_get_signal:           'compass',
  compass_get_interventions:    'compass',
  compass_get_cause:            'compass',
  compass_get_domain_signals:   'compass',
  compass_get_critical_signals: 'compass',

  // Engram tools → local stdio (Phase 3 C3 — contact memory)
  engram_search:  'engram',
  engram_add:     'engram',

  // PostHog tools → external API (optional)
  // requires posthog_distinct_id = contact_id mapping to be configured
  posthog_get_contact_events:   'posthog',
  posthog_get_feature_adoption: 'posthog',
};

// ---------------------------------------------------------------------------
// Server connection state
// ---------------------------------------------------------------------------
interface ServerConnection {
  client:    Client;
  connected: boolean;
  optional:  boolean;   // if true, startup continues when connection fails
}

const servers: Map<string, ServerConnection> = new Map();

// ---------------------------------------------------------------------------
// Initialize all MCP server connections
// Call once at cognitive layer startup
// ---------------------------------------------------------------------------
export async function initMcpClients(): Promise<void> {
  // --- Compass: local stdio process ---
  try {
    const compassTransport = new StdioClientTransport({
      command: 'node',
      args:    ['dist/cognitive/src/mcp/compass-server.js']
    });
    const compassClient = new Client({ name: 'exnoria-cognitive', version: '1.0.0' });
    await compassClient.connect(compassTransport);
    servers.set('compass', { client: compassClient, connected: true, optional: false });
    logger.info({ server: 'compass', transport: 'stdio' }, 'MCP server connected');
  } catch (err) {
    logger.error({ err, server: 'compass' }, 'MCP server failed to connect — required, aborting');
    throw err;
   }

   // --- Engram: local stdio process (Phase 3 C3 — contact memory) ---
   try {
     const engramTransport = new StdioClientTransport({
       command: 'engram',
       args:    ['mcp']
     });
     const engramClient = new Client({ name: 'exnoria-cognitive', version: '1.0.0' });
     await engramClient.connect(engramTransport);
    servers.set('engram', { client: engramClient, connected: true, optional: true });
    logger.info({ server: 'engram', transport: 'stdio' }, 'MCP server connected');
  } catch (err) {
    logger.warn({ err, server: 'engram' }, 'MCP server failed to connect (optional — continuing)');
    servers.set('engram', { client: null as unknown as Client, connected: false, optional: true });
   }

   // --- PostHog: external API (optional — degrades gracefully) ---
  const posthogApiKey = process.env.POSTHOG_API_KEY;
  if (!posthogApiKey) {
    logger.warn({ server: 'posthog' }, 'POSTHOG_API_KEY not set — PostHog tools disabled');
    servers.set('posthog', { client: null as unknown as Client, connected: false, optional: true });
    return;
  }

  try {
    const posthogTransport = new StdioClientTransport({
      command: 'npx',
      args:    ['-y', 'mcp-remote@latest', 'https://mcp.posthog.com/mcp', '--header', `Authorization:Bearer ${posthogApiKey}`],
      env: {
        POSTHOG_API_KEY:    posthogApiKey,
        POSTHOG_HOST:       process.env.POSTHOG_HOST ?? 'https://app.posthog.com',
        POSTHOG_PROJECT_ID: process.env.POSTHOG_PROJECT_ID ?? '',
        ...process.env
      }
    });
    const posthogClient = new Client({ name: 'exnoria-cognitive', version: '1.0.0' });
    await posthogClient.connect(posthogTransport);
    servers.set('posthog', { client: posthogClient, connected: true, optional: true });
    logger.info({ server: 'posthog', transport: 'stdio' }, 'MCP server connected');
  } catch (err) {
    logger.warn({ err, server: 'posthog' }, 'MCP server failed to connect (optional — continuing)');
    servers.set('posthog', { client: null as unknown as Client, connected: false, optional: true });
  }
}

// ---------------------------------------------------------------------------
// Execute a context retrieval tool via the appropriate MCP server
// ---------------------------------------------------------------------------
export interface McpToolResult {
  success: boolean;
  content: string;
  error?:  string;
}

export async function executeMcpTool(
  toolName: string,
  args:     Record<string, unknown>
): Promise<McpToolResult> {
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
    const textContent = (result.content as Array<{ type: string; text: string }>)
      .filter(c => c.type === 'text')
      .map(c => c.text)
      .join('\n');

    return { success: true, content: textContent };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ tool: toolName, err: message }, 'MCP tool call failed');
    return { success: false, content: '', error: message };
  }
}

// ---------------------------------------------------------------------------
// Check if a tool name is an MCP context retrieval tool
// ---------------------------------------------------------------------------
export function isMcpTool(toolName: string): boolean {
  return toolName in TOOL_SERVER_MAP;
}

// ---------------------------------------------------------------------------
// Shutdown all connections
// ---------------------------------------------------------------------------
export async function shutdownMcpClients(): Promise<void> {
  for (const [name, server] of servers) {
    if (server.connected) {
      try {
        await server.client.close();
        logger.info({ server: name }, 'MCP server disconnected');
      } catch (err) {
        logger.warn({ err, server: name }, 'Error disconnecting MCP server');
      }
    }
  }
  servers.clear();
}
