#!/usr/bin/env bash
# ==============================================================================
# Xnoria — Health Check Script
# deploy/health-check.sh
#
# Validates the full Xnoria stack is operational.
# Exit 0: all checks pass
# Exit 1: one or more checks failed (summary printed to stdout)
# ==============================================================================
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
PROJECT_ID="${PROJECT_ID:-exnoria}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

PASS="${GREEN}✓${NC}"
FAIL="${RED}✗${NC}"

FAILURES=0
RESULTS=""

check() {
  local name="$1"
  local result="$2"  # "pass" or "fail"
  local detail="${3:-}"

  if [ "${result}" = "pass" ]; then
    RESULTS="${RESULTS}\n  ${PASS} ${name}"
  else
    RESULTS="${RESULTS}\n  ${FAIL} ${name}${detail:+: ${detail}}"
    FAILURES=$((FAILURES + 1))
  fi
}

# Load .env for TELEGRAM_BOT_TOKEN etc.
ENV_FILE="${REPO_ROOT}/.env"
if [ -f "${ENV_FILE}" ]; then
  set +u
  while IFS='=' read -r key value; do
    case "${key}" in
      \#*|"") continue ;;
    esac
    if [ -z "$(eval echo "\${${key}:-}")" ]; then
      export "${key}=${value}" 2>/dev/null || true
    fi
  done < "${ENV_FILE}"
  set -u
fi

echo ""
echo -e "${BOLD}Xnoria Health Check${NC}"
echo -e "$(date '+%Y-%m-%d %H:%M:%S')"
echo ""

cd "${REPO_ROOT}"

# ------------------------------------------------------------------------------
# 1. Postgres — pg_isready
# ------------------------------------------------------------------------------
if docker compose exec -T postgres pg_isready -U "${PROJECT_ID}" -d "${POSTGRES_DB:-exnoria}" >/dev/null 2>&1; then
  check "Postgres (pg_isready)" "pass"
else
  check "Postgres (pg_isready)" "fail" "postgres container not healthy"
fi

# ------------------------------------------------------------------------------
# 2. n8n — GET /healthz returns 200
# ------------------------------------------------------------------------------
N8N_STATUS="$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:5678/healthz 2>/dev/null || echo "000")"
if [ "${N8N_STATUS}" = "200" ]; then
  check "n8n (GET /healthz)" "pass"
else
  check "n8n (GET /healthz)" "fail" "HTTP ${N8N_STATUS}"
fi

# ------------------------------------------------------------------------------
# 3. Filter service — GET /health returns {"status":"ok"}
# ------------------------------------------------------------------------------
FILTER_BODY="$(curl -s --max-time 5 http://localhost:3000/health 2>/dev/null || echo "")"
if echo "${FILTER_BODY}" | grep -q '"status":"ok"' 2>/dev/null; then
  check "Filter service (GET /health)" "pass"
else
  check "Filter service (GET /health)" "fail" "unexpected response: ${FILTER_BODY}"
fi

# ------------------------------------------------------------------------------
# 4. Dashboard — GET /api/health returns 200
# ------------------------------------------------------------------------------
DASHBOARD_STATUS="$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:4000/api/health 2>/dev/null || echo "000")"
if [ "${DASHBOARD_STATUS}" = "200" ]; then
  check "Dashboard (GET /api/health)" "pass"
else
  check "Dashboard (GET /api/health)" "fail" "HTTP ${DASHBOARD_STATUS}"
fi

# ------------------------------------------------------------------------------
# 5. Cognitive container — running
# ------------------------------------------------------------------------------
COGNITIVE_STATUS="$(docker inspect --format='{{.State.Status}}' "${PROJECT_ID}_cognitive" 2>/dev/null || echo "not_found")"
if [ "${COGNITIVE_STATUS}" = "running" ]; then
  check "Cognitive container (running)" "pass"
else
  check "Cognitive container (running)" "fail" "status: ${COGNITIVE_STATUS}"
fi

# ------------------------------------------------------------------------------
# 6. Filter actions — at least 3 enabled rows
# ------------------------------------------------------------------------------
ACTION_COUNT="$(docker compose exec -T postgres psql -U "${PROJECT_ID}" -d "${POSTGRES_DB:-exnoria}" -t -c \
  "SELECT COUNT(*) FROM filter_action WHERE enabled = true;" 2>/dev/null | tr -d ' \n' || echo "0")"
if [ "${ACTION_COUNT:-0}" -ge 3 ] 2>/dev/null; then
  check "Filter actions (>= 3 enabled)" "pass"
else
  check "Filter actions (>= 3 enabled)" "fail" "count: ${ACTION_COUNT:-0}"
fi

# ------------------------------------------------------------------------------
# 7. pgvector extension
# ------------------------------------------------------------------------------
VECTOR_EXT="$(docker compose exec -T postgres psql -U "${PROJECT_ID}" -d "${POSTGRES_DB:-exnoria}" -t -c \
  "SELECT COUNT(*) FROM pg_extension WHERE extname = 'vector';" 2>/dev/null | tr -d ' \n' || echo "0")"
if [ "${VECTOR_EXT:-0}" -eq 1 ] 2>/dev/null; then
  check "pgvector extension" "pass"
else
  check "pgvector extension" "fail" "extension not found"
fi

# ------------------------------------------------------------------------------
# 8. Telegram Bot — getMe returns ok
# ------------------------------------------------------------------------------
BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
if [ -n "${BOT_TOKEN}" ]; then
  TELEGRAM_OK="$(curl -s --max-time 5 "https://api.telegram.org/bot${BOT_TOKEN}/getMe" 2>/dev/null \
    | grep -c '"ok":true' 2>/dev/null || echo "0")"
  if [ "${TELEGRAM_OK}" -ge 1 ] 2>/dev/null; then
    check "Telegram Bot (getMe)" "pass"
  else
    check "Telegram Bot (getMe)" "fail" "API did not return ok:true"
  fi
else
  check "Telegram Bot (getMe)" "fail" "TELEGRAM_BOT_TOKEN not set"
fi

# ------------------------------------------------------------------------------
# Summary
# ------------------------------------------------------------------------------
echo -e "${RESULTS}"
echo ""

if [ "${FAILURES}" -eq 0 ]; then
  echo -e "${GREEN}${BOLD}All checks passed.${NC}"
  exit 0
else
  echo -e "${RED}${BOLD}${FAILURES} check(s) failed.${NC}"
  echo -e "${YELLOW}Run 'docker compose logs <service>' to investigate.${NC}"
  exit 1
fi
