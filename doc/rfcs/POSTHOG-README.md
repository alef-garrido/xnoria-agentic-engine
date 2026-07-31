# PostHog MCP Integration

## Overview
PostHog is configured as an **optional context source** for the cognitive layer, primarily for the Lifecycle specialist (PRD/ONB clusters). The integration is fully implemented and operational with graceful degradation.

## Current Status
- ✅ **PostHog Cloud Instance**: Connected successfully to `https://app.posthog.com`
- ✅ **MCP Transport**: Working via `npx mcp-remote@latest`
- ✅ **API Credentials**: Valid Personal API Key in use
- ✅ **Cognitive Layer**: Integration complete and tested
- ⏳ **Product Instrumentation**: NOT YET IMPLEMENTED (future B3/B4 work)
- ⏳ **Identity Mapping**: NOT YET IMPLEMENTED (requires `posthog.identify(hubspot_contact_id)` in product)

## Architecture

### Dependency Chain (Phase 3 B3)
```
1. ✅ PostHog instance running (Cloud - app.posthog.com)
2. ⏳ Product instrumented with tracking calls (feature_used, task_started, etc.)
3. ⏳ Identity resolved: posthog.identify(hubspot_contact_id) at login
4. ✅ PostHog MCP server added to cognitive MCP client
5. ✅ POSTHOG_* environment variables set in .env
6. ⏳ Cognitive layer pre-processing calls posthog_get_contact_events
```

### Environment Variables (`.env`)
```bash
POSTHOG_API_KEY=phx_...               # Personal API Key (required)
POSTHOG_HOST=https://app.posthog.com  # PostHog region
POSTHOG_PROJECT_ID=375314             # Project ID
POSTHOG_PROJECT_TOKEN=phc_...         # Project token (for tracking API)
```

### Docker Configuration (`docker-compose.yml`)
The cognitive service requires `tmpfs` mounts to support `npx mcp-remote`:
```yaml
read_only: true
tmpfs:
  - /tmp
  - /root/.mcp-auth
  - /root/.npm
```

The `/root/.npm` mount is **critical** - `npx` needs to fetch packages from npm registry and cache them.

## Technical Implementation

### MCP Client (`layers/cognitive/src/mcp/client.ts`)
```typescript
const posthogTransport = new StdioClientTransport({
  command: 'npx',
  args:    ['-y', 'mcp-remote@latest', 'https://mcp.posthog.com/mcp', 
            '--header', `Authorization:Bearer ${posthogApiKey}`],
  env: {
    POSTHOG_API_KEY:    posthogApiKey,
    POSTHOG_HOST:       process.env.POSTHOG_HOST,
    POSTHOG_PROJECT_ID: process.env.POSTHOG_PROJECT_ID,
    ...process.env
  }
});
```

### Tool Definitions (`layers/cognitive/src/tools/definitions.ts`)
Two context retrieval tools defined (read-only, not dispatched to filter):

1. **`posthog_get_contact_events`**: Retrieve recent events for a contact
2. **`posthog_get_feature_adoption`**: Get feature adoption metrics

Both tools are mapped to `null` in `TOOL_TO_ACTION`, meaning they're MCP-routed, not filter-dispatched.

### Graceful Degradation
The integration gracefully degrades:
- If `POSTHOG_API_KEY` not set → tools disabled, logs warning
- If connection fails → continues operation with Engram+Compass only
- If no PostHog data returned → cognitive layer reasons from available context

## Usage Pattern

### For Lifecycle Specialist (PRD/ONB)
1. Signal arrives → PRD_FRC_01 or ONB_FRC_01 indicator detected
2. Cognitive layer calls `posthog_get_contact_events(contact_id, event_names, days)`
3. If successful → enriches context with live PostHog events
4. If failed/disabled → falls back to Engram memory + Compass context

### Product Instrumentation Required
To make PostHog useful, the product needs:

```javascript
// At user login
posthog.identify(hubspot_contact_id);

// Feature usage events
posthog.capture('feature_used', {
  feature_name: 'some_feature',
  hubspot_contact_id: hubspot_contact_id
});

// Onboarding step events
posthog.capture('onboarding_step_completed', {
  step_name: 'step_x',
  hubspot_contact_id: hubspot_contact_id
});

// Task events
posthog.capture('task_started', { ... });
posthog.capture('task_completed', { ... });
```

## Mapping Identity

**CRITICAL:** For PostHog queries to match HubSpot contacts, the identity must be resolved:

```
HubSpot contact_id === PostHog distinct_id
```

This requires calling `posthog.identify(contact_id)` in the product at user login.

Without this mapping, PostHog queries will return empty/nonexistent data.

## Testing

### Verify PostHog API Access
```bash
curl -s "https://app.posthog.com/api/projects/375314" \
  -H "Authorization: Bearer phx_..." | jq '.name'
```

### Check Cognitive Logs
```bash
docker logs exnoria_cognitive | grep "PostHog MCP"
# Should show: [mcp-client] PostHog MCP connected (stdio)
```

### Verify Container Env Vars
```bash
docker exec exnoria_cognitive printenv | grep POSTHOG
```

## Known Limitations

1. **No Tracking Calls**: Product hasn't instrumented PostHog tracking
2. **No Identity Resolution**: `posthog.identify()` not called in product
3. **Read-Only Access**: PostHog tools only read, no write operations
4. **Optional Context**: PostHog is not required for operation

## Reference Links
- [PostHog MCP Documentation](https://posthog.com/docs/model-context-protocol)
- [PostHog Events API](https://posthog.com/docs/api/events)
- [PostHog Identify](https://posthog.com/docs/integrations/javascript-integration#identifying-users)
- [mcp-remote](https://www.npmjs.com/package/mcp-remote)
