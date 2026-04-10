#!/usr/bin/env python3

import mempalace.mcp_server
import traceback

print("MemPalace module loaded successfully")
print("Module file:", mempalace.mcp_server.__file__)

try:
    print("Starting MemPalace MCP server...")
    mempalace.mcp_server.main()
except Exception as e:
    print(f"Error: {e}")
    traceback.print_exc()
    # Keep the container running for investigation
    import time
    time.sleep(3600)