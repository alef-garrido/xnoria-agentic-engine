#!/usr/bin/env node

// Test script to verify MCP client functionality
const { initMcpClients, executeMcpTool } = require('../layers/cognitive/dist/mcp/client');

async function testMCP() {
  try {
    console.log('🧪 Testing MCP Client...');
    
    // Initialize MCP clients
    await initMcpClients();
    console.log('✅ MCP clients initialized');
    
    // Test Compass tool (should work)
    console.log('Testing Compass tool...');
    const compassResult = await executeMcpTool('compass_get_signal', { signal_id: 'SUP_RES_01' });
    console.log('Compass result:', compassResult);
    
    // Test MemPalace tool (should fail gracefully)
    console.log('Testing MemPalace tool...');
    const mempalaceResult = await executeMcpTool('mempalace_search', { query: 'test', contact_id: 'test-123' });
    console.log('MemPalace result:', mempalaceResult);
    
    console.log('🎉 MCP test completed!');
    
  } catch (error) {
    console.error('❌ MCP test failed:', error);
  }
}

testMCP();