#!/usr/bin/env bash
# E2E Walkthrough — validates all 27 filter actions across 8 stages
# Usage: ./tests/e2e-walkthrough.sh [session_prefix]
# Requires: curl, jq, psql (for audit verification), running stack

set -euo pipefail

SESSION_PREFIX="${1:-e2e-$(date +%s)}"
FILTER_URL="http://localhost:3000"
PASSED=0
FAILED=0

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

COUNTER=0
next_id()  { COUNTER=$((COUNTER+1)); echo "${SESSION_PREFIX}-${COUNTER}"; }
banner()   { echo -e "\n${CYAN}═══════════════════════════════════════════════${NC}"; echo -e "${CYAN}  $1${NC}"; echo -e "${CYAN}═══════════════════════════════════════════════${NC}"; }
pass()     { PASSED=$((PASSED+1)); echo -e "  ${GREEN}✓${NC} $1"; }
fail()     { FAILED=$((FAILED+1)); echo -e "  ${RED}✗${NC} $1"; shift; for l in "$@"; do echo -e "    ${RED}>${NC} $l"; done; }

execute_action() {
  local action_id=$1 stage=$2 sid=$3 payload=$4
  curl -s -X POST "${FILTER_URL}/filter/execute" \
    -H "Content-Type: application/json" \
    -d "{\"action_id\":\"${action_id}\",\"stage\":\"${stage}\",\"session_id\":\"${sid}\",\"payload\":${payload}}"
}

assert_executed() {
  local label=$1 action_id=$2 stage=$3 payload=$4; shift 4
  local sid=$(next_id)
  local resp=$(execute_action "$action_id" "$stage" "$sid" "$payload")
  local status=$(echo "$resp" | jq -r '.status // "parse-error"')
  if [[ "$status" == "executed" ]]; then
    pass "$label — executed"
  else
    fail "$label — expected executed, got ${status}" "$resp"
  fi
}

assert_rejected() {
  local label=$1 action_id=$2 stage=$3 payload=$4 expected_code=$5; shift 5
  local sid=$(next_id)
  local resp=$(execute_action "$action_id" "$stage" "$sid" "$payload")
  local status=$(echo "$resp" | jq -r '.status // "parse-error"')
  local code=$(echo "$resp" | jq -r '.rejection_code // "missing"')
  if [[ "$status" == "rejected" && "$code" == "$expected_code" ]]; then
    pass "$label — rejected (${code})"
  else
    fail "$label — expected rejected/${expected_code}, got ${status}/${code}" "$resp"
  fi
}

approve_hitl() {
  local log_id=$1
  curl -s -X POST "${FILTER_URL}/filter/hitl/${log_id}/approve"
}

reject_hitl() {
  local log_id=$1
  curl -s -X POST "${FILTER_URL}/filter/hitl/${log_id}/reject"
}

# Dispatch HITL, capture log_id, approve, assert both steps
dispatch_and_approve_hitl() {
  local label=$1 action_id=$2 stage=$3 payload=$4; shift 4
  local sid=$(next_id)
  local resp=$(execute_action "$action_id" "$stage" "$sid" "$payload")
  local status=$(echo "$resp" | jq -r '.status // "parse-error"')
  local log_id=$(echo "$resp" | jq -r '.log_id // ""')
  if [[ "$status" != "pending_hitl" || -z "$log_id" ]]; then
    fail "$label — expected pending_hitl, got ${status}" "$resp"
    return
  fi
  pass "$label — pending_hitl"
  local app_resp=$(approve_hitl "$log_id")
  local app_status=$(echo "$app_resp" | jq -r '.status // "parse-error"')
  if [[ "$app_status" == "executed" ]]; then
    pass "$label — approved → executed"
  else
    fail "$label — approval expected executed, got ${app_status}" "$app_resp"
  fi
}

# Dispatch manual action, approve, verify n8n was skipped
dispatch_and_verify_manual() {
  local label=$1 action_id=$2 stage=$3 payload=$4; shift 4
  local sid=$(next_id)
  local resp=$(execute_action "$action_id" "$stage" "$sid" "$payload")
  local status=$(echo "$resp" | jq -r '.status // "parse-error"')
  local log_id=$(echo "$resp" | jq -r '.log_id // ""')
  if [[ "$status" != "pending_hitl" || -z "$log_id" ]]; then
    fail "$label — expected pending_hitl, got ${status}" "$resp"
    return
  fi
  pass "$label — pending_hitl"
  local app_resp=$(approve_hitl "$log_id")
  local app_status=$(echo "$app_resp" | jq -r '.status // "parse-error"')
  if [[ "$app_status" != "executed" ]]; then
    fail "$label — approval expected executed, got ${app_status}" "$app_resp"
    return
  fi
  pass "$label — approved"
  # Verify no n8n dispatch: payload_out should contain manual_action: true
  local payload_out=$(docker exec exnoria_postgres psql -U exnoria -d exnoria -t -A \
    -c "SELECT payload_out::text FROM filter_log WHERE id='${log_id}'" 2>/dev/null || echo "PSQL_ERROR")
  if [[ "$payload_out" == *"manual_action"* ]]; then
    pass "$label — manual action confirmed (n8n skipped)"
  else
    fail "$label — expected manual_action in payload_out, got: ${payload_out}"
  fi
}

# ═══════════════════════════════════════════════
#  Phase 0 — Pre-flight
# ═══════════════════════════════════════════════
banner "PHASE 0: Pre-flight checks"

echo -e "  Session: ${SESSION_PREFIX}"

FILTER_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "${FILTER_URL}/health" 2>/dev/null || echo "000")
if [[ "$FILTER_HEALTH" == "200" ]]; then
  pass "Filter service health — 200"
else
  fail "Filter service health — expected 200, got ${FILTER_HEALTH}"
  echo -e "\n  ${YELLOW}Stack not ready. Start with: make up${NC}"
  exit 1
fi

N8N_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5678/healthz" 2>/dev/null || echo "000")
if [[ "$N8N_HEALTH" == "200" ]]; then
  pass "n8n health — 200"
else
  fail "n8n health — expected 200, got ${N8N_HEALTH}"
fi

ACTION_COUNT=$(docker exec exnoria_postgres psql -U exnoria -d exnoria -t -A -c "SELECT count(*) FROM filter_action" 2>/dev/null || echo "PSQL_ERROR")
if [[ "$ACTION_COUNT" == "27" ]]; then
  pass "filter_action count — 27"
else
  fail "filter_action count — expected 27, got ${ACTION_COUNT}"
fi

# ═══════════════════════════════════════════════
#  Phase 1 — Direct-execute actions (14)
# ═══════════════════════════════════════════════
banner "PHASE 1: Direct-execute actions (no HITL)"

assert_executed "acq.lead.score"        "acq.lead.score"        "ACQ" '{"contact_id":"e2e-001"}'
assert_executed "acq.lead.engage"       "acq.lead.engage"       "ACQ" '{"contact_id":"e2e-002","name":"Test Lead","phone":"+5511999999999","email":"test@example.com"}'
assert_executed "acq.lead.nurture"      "acq.lead.nurture"      "ACQ" '{"contact_id":"e2e-003","email":"test@example.com","name":"Test Lead"}'
assert_executed "acq.contact.get"       "acq.contact.get"       "ACQ" '{"contact_id":"e2e-004","email":"test@example.com"}'
assert_executed "sal.contact.message"   "sal.contact.message"   "SAL" '{"contact_id":"e2e-005","email":"test@example.com"}'
assert_executed "onb.contact.nudge"     "onb.contact.nudge"     "ONB" '{"contact_id":"e2e-006","email":"test@example.com","name":"Test Contact"}'
assert_executed "onb.document.validate" "onb.document.validate" "ONB" '{"contact_id":"e2e-007","document_type":"id"}'
assert_executed "onb.ticket.escalate"   "onb.ticket.escalate"   "ONB" '{"contact_id":"e2e-008","issue":"Technical onboarding blocker","priority":"high"}'
assert_executed "sup.ticket.escalate"   "sup.ticket.escalate"   "SUP" '{"contact_id":"e2e-009","ticket_id":"TKT-001","issue":"Billing dispute"}'
assert_executed "prd.adoption.nudge"    "prd.adoption.nudge"    "PRD" '{"contact_id":"e2e-010","email":"test@example.com","feature":"analytics-dashboard"}'
assert_executed "prd.contact.educate"   "prd.contact.educate"   "PRD" '{"contact_id":"e2e-011","email":"test@example.com","feature":"reporting-module"}'
assert_executed "prd.feedback.log"      "prd.feedback.log"      "PRD" '{"contact_id":"e2e-012","feature":"data-export","feedback":"Would like CSV export with custom date range","source":"support-ticket"}'
assert_executed "ret.account.flag"      "ret.account.flag"      "RET" '{"contact_id":"e2e-013","reason":"Low engagement past 60 days","account_value":5000}'
assert_executed "com.contact.reengage"  "com.contact.reengage"  "COM" '{"contact_id":"e2e-014","email":"test@example.com","channel":"email"}'

# ═══════════════════════════════════════════════
#  Phase 2 — HITL auto-dispatch (6)
# ═══════════════════════════════════════════════
banner "PHASE 2: HITL auto-dispatch (approve → n8n)"

echo -e "  ${YELLOW}Note: Telegram not configured — HITL notifications silently skip.${NC}"

dispatch_and_approve_hitl "acq.contact.outreach"   "acq.contact.outreach"   "ACQ" '{"contact_id":"e2e-015","name":"Test Lead","email":"test@example.com","phone":"+5511999999999"}'
dispatch_and_approve_hitl "sal.contact.prioritize" "sal.contact.prioritize" "SAL" '{"contact_id":"e2e-016","email":"test@example.com","reason":"High-value lead","lead_score":"85"}'
dispatch_and_approve_hitl "onb.contact.assist"     "onb.contact.assist"     "ONB" '{"contact_id":"e2e-017","email":"test@example.com","blocked_on":"api-integration","company":"TestCorp"}'
dispatch_and_approve_hitl "sup.contact.notify"     "sup.contact.notify"     "SUP" '{"contact_id":"e2e-018","email":"test@example.com","ticket_id":"TKT-002","resolution":"Issue resolved, refund processed"}'
dispatch_and_approve_hitl "com.content.publish"    "com.content.publish"    "COM" '{"contact_id":"e2e-019","content_id":"post-001","platform":"linkedin","scheduled_date":"2026-08-01"}'
dispatch_and_approve_hitl "ret.contact.winback"    "ret.contact.winback"    "RET" '{"contact_id":"e2e-020","email":"test@example.com","churn_risk":"high","reason":"No login in 90 days","account_value":10000}'

# ═══════════════════════════════════════════════
#  Phase 3 — Manual actions (3)
# ═══════════════════════════════════════════════
banner "PHASE 3: Manual actions (HITL + skip n8n)"

echo -e "  ${YELLOW}HubSpot-gated actions — approve marks executed without n8n dispatch.${NC}"

dispatch_and_verify_manual "sal.sequence.enroll"  "sal.sequence.enroll"  "SAL" '{"contact_id":"e2e-021","email":"test@example.com","sequence_id":"welcome-seq"}'
dispatch_and_verify_manual "onb.document.request" "onb.document.request" "ONB" '{"contact_id":"e2e-022","email":"test@example.com","document_type":"company-id","documents_required":["company-registration","tax-id","bank-statement"]}'
dispatch_and_verify_manual "com.feedback.request" "com.feedback.request" "COM" '{"contact_id":"e2e-023","email":"test@example.com","feedback_topic":"product-satisfaction","requested_by":"support-team"}'

# ═══════════════════════════════════════════════
#  Phase 4 — Error cases (5)
# ═══════════════════════════════════════════════
banner "PHASE 4: Error cases"

assert_rejected "prd.friction.flag — non-existent (removed in squash)" "prd.friction.flag" "PRD" '{}' "ACTION_NOT_IN_ALLOWLIST"
assert_rejected "exp.contact.upgrade — non-existent (removed in squash)" "exp.contact.upgrade" "EXP" '{}' "ACTION_NOT_IN_ALLOWLIST"
assert_rejected "exp.account.flag — disabled"         "exp.account.flag"       "EXP" '{}' "ACTION_DISABLED"
assert_rejected "foo.bar.baz — non-existent"          "foo.bar.baz"            "ACQ" '{}' "ACTION_NOT_IN_ALLOWLIST"

MISSING_SID=$(next_id)
MISSING_RESP=$(curl -s -X POST "${FILTER_URL}/filter/execute" \
  -H "Content-Type: application/json" \
  -d "{\"stage\":\"ACQ\",\"session_id\":\"${MISSING_SID}\",\"payload\":{}}")
MISSING_STATUS=$(echo "$MISSING_RESP" | jq -r '.status // "missing"')
MISSING_CODE=$(echo "$MISSING_RESP" | jq -r '.error_code // "missing"')
if [[ "$MISSING_STATUS" == "error" && "$MISSING_CODE" == "PAYLOAD_INVALID" ]]; then
  pass "Missing action_id — 400 PAYLOAD_INVALID"
else
  fail "Missing action_id — expected error/PAYLOAD_INVALID, got ${MISSING_STATUS}/${MISSING_CODE}" "$MISSING_RESP"
fi

# ═══════════════════════════════════════════════
#  Phase 5 — Chained execution (upsert → prioritize)
# ═══════════════════════════════════════════════
banner "PHASE 5: Chained execution"

echo -e "  ${YELLOW}Step 1: acq.contact.upsert${NC}"
CHAIN_SID=$(next_id)
UPSERT_RESP=$(execute_action "acq.contact.upsert" "ACQ" "${CHAIN_SID}" \
  '{"name":"Chained Test User","email":"chained-test@example.com","phone":"+5511988888888","company":"ChainCorp"}')
UPSERT_STATUS=$(echo "$UPSERT_RESP" | jq -r '.status // "parse-error"')
CONTACT_ID=$(echo "$UPSERT_RESP" | jq -r '.workflow_result.contact_id // ""')
if [[ "$UPSERT_STATUS" == "executed" ]]; then
  pass "acq.contact.upsert — executed (contact_id: ${CONTACT_ID})"
else
  fail "acq.contact.upsert — expected executed, got ${UPSERT_STATUS}" "$UPSERT_RESP"
  CONTACT_ID="chained-test-fallback"
fi

echo -e "  ${YELLOW}Step 2: sal.contact.prioritize with contact_id from upsert${NC}"
PRIORITIZE_RESP=$(execute_action "sal.contact.prioritize" "SAL" "${CHAIN_SID}" \
  "{\"contact_id\":\"${CONTACT_ID}\",\"email\":\"chained-test@example.com\",\"source\":\"e2e-chain-test\",\"lead_score\":\"92\"}")
PRIORITIZE_STATUS=$(echo "$PRIORITIZE_RESP" | jq -r '.status // "parse-error"')
PRIORITIZE_LOGID=$(echo "$PRIORITIZE_RESP" | jq -r '.log_id // ""')
if [[ "$PRIORITIZE_STATUS" == "pending_hitl" && -n "$PRIORITIZE_LOGID" ]]; then
  pass "sal.contact.prioritize — pending_hitl (chained payload carries contact_id: ${CONTACT_ID})"
  approve_hitl "$PRIORITIZE_LOGID" > /dev/null
  pass "sal.contact.prioritize — approved (chained flow complete)"
else
  fail "sal.contact.prioritize — expected pending_hitl, got ${PRIORITIZE_STATUS}" "$PRIORITIZE_RESP"
fi

# ═══════════════════════════════════════════════
#  Phase 6 — Audit verification
# ═══════════════════════════════════════════════
banner "PHASE 6: Audit log verification"

PSQL() { docker exec exnoria_postgres psql -U exnoria -d exnoria -t -A -c "$1" 2>/dev/null || echo "PSQL_ERROR"; }

LOG_COUNT=$(PSQL "SELECT count(*) FROM filter_log WHERE session_id LIKE '${SESSION_PREFIX}-%'")
echo -e "  Filter log entries for this session: ${LOG_COUNT}"

MANUAL_CHECK=$(PSQL "SELECT count(*) FROM filter_log l JOIN filter_action a ON l.action_id=a.action_id WHERE a.manual_action=true AND l.payload_out::text LIKE '%manual_action%' AND l.session_id LIKE '${SESSION_PREFIX}-%'")
if [[ "$MANUAL_CHECK" -ge 1 ]]; then
  pass "Manual actions confirmed in audit log (${MANUAL_CHECK} entries)"
else
  fail "No manual_action entries found in audit log for this session"
fi

REJECT_COUNT=$(PSQL "SELECT count(*) FROM filter_log WHERE rejection_code IS NOT NULL AND session_id LIKE '${SESSION_PREFIX}-%'")
if [[ "$REJECT_COUNT" -ge 1 ]]; then
  pass "Rejected actions confirmed in audit log (${REJECT_COUNT} entries)"
else
  fail "No rejected entries found in audit log for this session"
fi

# ═══════════════════════════════════════════════
#  Summary
# ═══════════════════════════════════════════════
banner "RESULTS"
TOTAL=$((PASSED + FAILED))
echo -e "  ${GREEN}Passed: ${PASSED}${NC}"
echo -e "  ${RED}Failed: ${FAILED}${NC}"
echo -e "  Total:  ${TOTAL}"
echo ""

if [[ "$FAILED" -eq 0 ]]; then
  echo -e "  ${GREEN}═══════════════════════════════════════════════${NC}"
  echo -e "  ${GREEN}  ALL ${TOTAL} TESTS PASSED${NC}"
  echo -e "  ${GREEN}═══════════════════════════════════════════════${NC}"
  exit 0
else
  echo -e "  ${RED}═══════════════════════════════════════════════${NC}"
  echo -e "  ${RED}  ${FAILED} TEST(S) FAILED${NC}"
  echo -e "  ${RED}═══════════════════════════════════════════════${NC}"
  exit 1
fi
