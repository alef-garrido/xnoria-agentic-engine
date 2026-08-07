# Engram Persistent Memory

## Memory

You have access to Engram persistent memory via MCP tools (`mem_save`, `mem_search`, `mem_session_summary`, `mem_context`, etc.).

- Save proactively after significant work — don't wait to be asked.
- After any compaction or context reset, call `mem_context` to recover session state before continuing.
- Ensure to call `mem_session_summary` before ending major tasks.
