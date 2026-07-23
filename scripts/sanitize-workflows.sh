#!/usr/bin/env bash
# ==============================================================================
# Xnoria Agentic Engine — n8n Workflow Sanitization Utility
# ==============================================================================

set -euo pipefail

WORKFLOW_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../workflows/n8n" && pwd)"

echo "🔍 Sanitizing n8n workflows in $WORKFLOW_DIR..."

COUNT=0
for wf in "$WORKFLOW_DIR"/*.json; do
  if [ -f "$wf" ]; then
    # Ensure JSON formatting is clean
    if jq . "$wf" > /dev/null 2>&1; then
      # Strip execution data / static runtime instance IDs if present
      tmp_file=$(mktemp)
      jq 'del(.instanceId?, .active?, .pinData?)' "$wf" > "$tmp_file" && mv "$tmp_file" "$wf"
      COUNT=$((COUNT + 1))
    else
      echo "⚠️ Invalid JSON file detected: $(basename "$wf")"
    fi
  fi
done

echo "✅ Successfully sanitized $COUNT workflow template files."
