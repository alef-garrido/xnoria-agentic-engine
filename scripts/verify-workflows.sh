#!/bin/bash
# Verify all enabled filter actions have workflow JSON files
# Run before any docker compose down operation
#
# Returns exit code 0 if all workflows are exported, 1 if any are missing

set -e

# Get database name from environment, fallback to default
POSTGRES_DB=${POSTGRES_DB:-exnoria}

# PostgreSQL connection check
echo "🔍 Checking PostgreSQL connection..."
if ! docker compose exec -T postgres psql -U exnoria -d "$POSTGRES_DB" -c "SELECT 1" >/dev/null 2>!; then
    echo "❌ PostgreSQL is not running or connection failed"
    exit 1
fi

echo "✅ PostgreSQL connection successful"
echo "🔍 Checking for missing workflow exports..."

# Get all enabled filter actions that are not placeholders
SQL="SELECT action_id FROM filter_action WHERE enabled = true AND action_id NOT LIKE 'exp.%' AND action_id NOT LIKE 'placeholder%'"

MISSING=0
TOTAL=0

# Execute the query and process each action ID
while IFS= read -r action_id; do
# Skip empty lines
[ -z "$action_id" ] && continue

# Fix line endings and clean up the action_id
action_id=$(echo "$action_id" | tr -d '\r' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
[ -z "$action_id" ] && continue

TOTAL=$((TOTAL + 1))

# Check if the workflow JSON file exists
workflow_file="workflows/n8n/${action_id}.json"

if [ ! -f "$workflow_file" ]; then
    echo "❌ Missing: $workflow_file"
    MISSING=$((MISSING + 1))
else
    echo "✅ Found: $workflow_file"
fi

done < <( docker compose exec -T postgres psql -U exnoria -d "$POSTGRES_DB" -t -c "$SQL" )

echo ""
echo "📊 Summary:"
echo "• Total enabled workflows: $TOTAL"
echo "• Missing exports: $MISSING"

if [ $MISSING -eq 0 ]; then
    echo "✅ All enabled workflows have source control exports"
    exit 0
else
    echo ""
    echo "❌ CRITICAL: $MISSING workflow(s) missing from source control"
    echo ""
    echo "Before shutting down, you MUST:"
    echo "  1. Open n8n at http://localhost:5678"
    echo "  2. Export each missing workflow to workflows/n8n/"
    echo "  3. Files must be named with action_id: {action_id}.json"
    echo "  4. Run 'make verify-workflows' again to confirm"
    echo ""
    echo "These workflows contain customer data and cannot be recovered if lost!"
    exit 1
fi