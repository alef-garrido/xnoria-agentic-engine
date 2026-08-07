#!/bin/bash

PROJECT_ID="${PROJECT_ID:-exnoria}"

echo "=== Testing Telegram Bot Flow ==="

# Send test message
echo "1. Sending test message..."
curl -s -X POST "https://api.telegram.org/bot8629679199:AAFstJeiZqCycYRQNHhA9AO7quXJ2UYe2PA/sendMessage" \
  -d "chat_id=8573499411" \
  -d "text=ONB Debug test message $(date +%s)" > /dev/null

echo "2. Waiting 10 seconds for processing..."
sleep 10

echo "3. Checking session count..."
SESSION_COUNT=$(docker exec "${PROJECT_ID}_postgres" psql -U "${PROJECT_ID}" -d "${POSTGRES_DB:-exnoria}" -t -c "SELECT COUNT(*) FROM cognitive_session;" 2>/dev/null | xargs)
echo "   Sessions: $SESSION_COUNT"

echo "4. Checking history count..."
HISTORY_COUNT=$(docker exec "${PROJECT_ID}_postgres" psql -U "${PROJECT_ID}" -d "${POSTGRES_DB:-exnoria}" -t -c "SELECT COUNT(*) FROM cognitive_history;" 2>/dev/null | xargs)
echo "   History entries: $HISTORY_COUNT"

echo "5. Checking recent cognitive logs..."
docker compose logs cognitive | tail -20 | grep -E "(telegram|single|session|error)" || echo "   No relevant logs found"

echo "=== Test completed ==="