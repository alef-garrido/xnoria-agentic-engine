// Test script to discover what tools Engram MCP actually provides

const { initMcpClients, executeMcpTool } = require("./dist/mcp/client.js");

async function testEngramTools() {
  console.log("Testing Engram MCP tools...");

  try {
    await initMcpClients();

    // Engram has 11 tools in the 'agent' profile
    // Let's try to call some likely candidates

    const testCases = [
      { tool: "get_memories", args: { project: "test" } },
      { tool: "search_memories", args: { query: "test" } },
      { tool: "save_memory", args: { title: "test", message: "test" } },
      { tool: "search", args: { query: "test" } },
    ];

    for (const testCase of testCases) {
      try {
        console.log(`Trying tool: ${testCase.tool}`);
        const result = await executeMcpTool(testCase.tool, testCase.args);
        console.log(`  Result:`, JSON.stringify(result, null, 2));
        if (result.success) break;
      } catch (err) {
        console.log(`  Failed:`, err.message);
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

testEngramTools();
