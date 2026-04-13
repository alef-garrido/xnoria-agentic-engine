#!/bin/bash
API_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZTE1MmE2Mi04ZmJiLTQ4MWYtODE4NS0yNWQwMjM2OTNhNzUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiN2UyYTA2ZDctMjJlMy00Njk1LTkxNjAtM2RiMDkzYWJmNGE4IiwiaWF0IjoxNzc1Njk5NzA4LCJleHAiOjE3ODMzOTY4MDB9.lJyo_mpjdpSXdc-YSronZ_R0Dqw6aFl4z-4TNKjEdGU'
BASE_URL='http://localhost:5678'

echo "Importing workflows..."

# Import each workflow
for workflow in acq.lead.score sal.sequence.enroll sal.contact.prioritize; do
  echo "Importing $workflow.json..."
  curl -s -X POST "$BASE_URL/api/v1/workflows" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $API_KEY" \
    --data-binary "@workflows/n8n/${workflow}.json" | jq '.' 2>/dev/null || echo "Response received (parsed inline)"
  echo ""
done

echo "Done!"
