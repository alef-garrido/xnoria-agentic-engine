// ==============================================================================
// Exnoria · Cognitive · MCP Client
// Multi-transport dispatcher for context retrieval tools
//
// Four transport types:
//   - Compass:   local stdio MCP process
//   - Engram:    local stdio MCP process (Phase 3 C3 — contact memory)
//   - MemPalace: Docker sidecar over HTTP/SSE (being deprecated)
//   - PostHog:   external API via PostHog MCP server (optional — degrades gracefully)
// ==============================================================================
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

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
  mempalace_search:             'engram',
  mempalace_add_drawer:         'engram',

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
      args:    ['dist/mcp/compass-server.js']
    });
    const compassClient = new Client({ name: 'exnoria-cognitive', version: '1.0.0' });
    await compassClient.connect(compassTransport);
    servers.set('compass', { client: compassClient, connected: true, optional: false });
     console.log('[mcp-client] Compass MCP connected (stdio)');
   } catch (err) {
     console.error('[mcp-client] Compass MCP failed to connect:', err);
     throw err;  // Compass is required — fail hard
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
     console.log('[mcp-client] Engram MCP connected (stdio)');
   } catch (err) {
     console.warn('[mcp-client] Engram MCP failed to connect (optional, continuing):', err);
     servers.set('engram', { client: null as unknown as Client, connected: false, optional: true });
   }

  // --- MemPalace: sidecar over HTTP/SSE ---
  const mempalaceUrl = process.env.MEMPALACE_MCP_URL;
  if (!mempalaceUrl) {
    console.warn('[mcp-client] MEMPALACE_MCP_URL not set — MemPalace tools disabled');
    servers.set('mempalace', { client: null as unknown as Client, connected: false, optional: true });
  } else {
    try {
      const mempalaceTransport = new SSEClientTransport(
        new URL(mempalaceUrl)
      );
      const mempalaceClient = new Client({ name: 'exnoria-cognitive', version: '1.0.0' });
      await mempalaceClient.connect(mempalaceTransport);
      servers.set('mempalace', { client: mempalaceClient, connected: true, optional: false });
      console.log(`[mcp-client] MemPalace MCF connected via SSE (${mempalaceUrl})`);
   } catch (err) {
     console.warn('[mcp-client] MemPalace MCP failed to connect via SSE (optional, continuing):', err);
     servers.set('mempalace', { client: null as unknown as Client, connected: false, optional: true });
   }
  }

  // --- PostHog: external API (optional — degrades gracefully) ---
  const posthogApiKey = process.env.POSTHOG_API_KEY;
  if (!posthogApiKey) {
    console.warn('[mcp-client] POSTHOG_API_KEY not set — PostHog tools disabled');
    servers.set('posthog', { client: null as unknown as Client, connected: false, optional: true });
    return;
  }

  try {
    const posthogTransport = new StdioClientTransport({
      command: 'npx',
      args:    ['-y', 'mcp-remote@latest', 'https://mcp.posthog.com/mcp', '--header', `Authorization:${process.env.POSTHOG_AUTH_HEADER}`],
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
    console.log('[mcp-client] PostHog MCP connected (stdio)');
  } catch (err) {
    console.warn('[mcp-client] PostHog MCP failed to connect (optional, continuing):', err);
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
    console.error(`[mcp-client] Tool ${toolName} failed:`, message);
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
        console.log(`[mcp-client] ${name} disconnected`);
      } catch (err) {
        console.warn(`[mcp-client] Error disconnecting ${name}:`, err);
      }
    }
  }
  servers.clear();
}
