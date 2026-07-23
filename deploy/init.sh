#!/usr/bin/env bash
# ==============================================================================
# Xnoria — Instance Initialization Script
# deploy/init.sh
#
# Usage:
#   ./deploy/init.sh [local|vps|edge]
#
# Non-interactive mode: export all required vars before running.
# Idempotent: running twice on an existing .env will not overwrite existing values.
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

info()    { echo -e "${BLUE}[xnoria]${NC} $*"; }
success() { echo -e "${GREEN}[xnoria]${NC} $*"; }
warn()    { echo -e "${YELLOW}[xnoria]${NC} $*"; }
error()   { echo -e "${RED}[xnoria] ERROR:${NC} $*" >&2; }
fatal()   { error "$*"; exit 1; }

prompt_if_unset() {
  local var_name="$1"
  local prompt_text="$2"
  local is_secret="${3:-false}"
  local current_val
  current_val="$(eval echo "\${${var_name}:-}")"

  if [ -n "${current_val}" ]; then
    if [ "${is_secret}" = "true" ]; then
      info "${var_name} already set — skipping prompt"
    else
      info "${var_name}=${current_val} (pre-set)"
    fi
    return
  fi

  if [ "${is_secret}" = "true" ]; then
    read -r -s -p "  ${prompt_text}: " input_val
    echo ""
  else
    read -r -p "  ${prompt_text}: " input_val
  fi

  eval "export ${var_name}='${input_val}'"
}

set_env_value() {
  local file="$1"
  local key="$2"
  local value="$3"

  if grep -q "^${key}=" "${file}" 2>/dev/null; then
    # Only overwrite if value is blank in file
    local current
    current="$(grep "^${key}=" "${file}" | cut -d= -f2-)"
    if [ -z "${current}" ]; then
      sed -i.bak "s|^${key}=.*|${key}=${value}|" "${file}"
      rm -f "${file}.bak"
    fi
  else
    echo "${key}=${value}" >> "${file}"
  fi
}

# ==============================================================================
# Step 1: Detect environment
# ==============================================================================
ENV_TARGET="${1:-}"

if [ -z "${ENV_TARGET}" ]; then
  echo ""
  echo -e "${BOLD}Xnoria Instance Initialization${NC}"
  echo ""
  echo "Select deployment target:"
  echo "  1) local  — Local development machine"
  echo "  2) vps    — Cloud VPS (Ubuntu 24, HTTPS, public domain)"
  echo "  3) edge   — Edge device (mini PC / Raspberry Pi, local network)"
  echo ""
  read -r -p "Enter target [local/vps/edge]: " ENV_TARGET
fi

case "${ENV_TARGET}" in
  local|vps|edge) ;;
  *) fatal "Invalid environment '${ENV_TARGET}'. Choose: local, vps, or edge" ;;
esac

info "Initializing Xnoria instance for environment: ${BOLD}${ENV_TARGET}${NC}"

# ==============================================================================
# Step 2: Copy environment template (idempotent — skip if .env exists)
# ==============================================================================
TEMPLATE_PATH="${REPO_ROOT}/deploy/environments/${ENV_TARGET}/.env.template"
ENV_PATH="${REPO_ROOT}/.env"

if [ ! -f "${TEMPLATE_PATH}" ]; then
  fatal "Environment template not found: ${TEMPLATE_PATH}"
fi

if [ -f "${ENV_PATH}" ]; then
  warn ".env already exists — merging missing variables only (no values overwritten)"
else
  info "Creating .env from ${ENV_TARGET} template..."
  cp "${TEMPLATE_PATH}" "${ENV_PATH}"
  success ".env created"
fi

# Source existing .env without executing commands
set +u
# shellcheck disable=SC1090
while IFS='=' read -r key value; do
  # Skip comments and empty lines
  case "${key}" in
    \#*|"") continue ;;
  esac
  # Only export if not already set in environment
  if [ -z "$(eval echo "\${${key}:-}")" ]; then
    export "${key}=${value}" 2>/dev/null || true
  fi
done < "${ENV_PATH}"
set -u

# ==============================================================================
# Step 3: Generate secrets (only if not already set)
# ==============================================================================
info "Checking generated secrets..."

if [ -z "${N8N_ENCRYPTION_KEY:-}" ]; then
  N8N_ENCRYPTION_KEY="$(openssl rand -hex 32)"
  export N8N_ENCRYPTION_KEY
  set_env_value "${ENV_PATH}" "N8N_ENCRYPTION_KEY" "${N8N_ENCRYPTION_KEY}"
  success "N8N_ENCRYPTION_KEY generated"
else
  info "N8N_ENCRYPTION_KEY already set — skipping"
fi

if [ -z "${DASHBOARD_AUTH_SECRET:-}" ]; then
  DASHBOARD_AUTH_SECRET="$(openssl rand -hex 32)"
  export DASHBOARD_AUTH_SECRET
  set_env_value "${ENV_PATH}" "DASHBOARD_AUTH_SECRET" "${DASHBOARD_AUTH_SECRET}"
  success "DASHBOARD_AUTH_SECRET generated"
else
  info "DASHBOARD_AUTH_SECRET already set — skipping"
fi

# ==============================================================================
# Step 4: Prompt for required credentials (skipped if already exported)
# ==============================================================================
echo ""
info "Collecting required credentials (press Enter to skip and set manually later)..."
echo ""

prompt_if_unset "POSTGRES_PASSWORD"           "Postgres password" "true"
prompt_if_unset "DASHBOARD_ADMIN_PASSWORD"    "Dashboard admin password" "true"
prompt_if_unset "LLM_API_KEY"                 "Groq API key" "true"
prompt_if_unset "EMBEDDING_API_KEY"           "Google Embedding API key" "true"
prompt_if_unset "HUBSPOT_PRIVATE_APP_TOKEN"   "HubSpot Private App token" "true"
prompt_if_unset "HUBSPOT_PORTAL_ID"           "HubSpot Portal ID"
prompt_if_unset "META_WA_TOKEN"               "Meta WhatsApp token" "true"
prompt_if_unset "META_PHONE_NUMBER_ID"        "Meta Phone Number ID"
prompt_if_unset "SDR_WHATSAPP_NUMBER"         "SDR WhatsApp number (international format)"
prompt_if_unset "TELEGRAM_BOT_TOKEN"          "Telegram Bot token" "true"
prompt_if_unset "TELEGRAM_OPERATOR_CHAT_ID"   "Telegram operator chat ID"

if [ "${ENV_TARGET}" = "vps" ] || [ "${ENV_TARGET}" = "edge" ]; then
  prompt_if_unset "N8N_HOST"       "n8n hostname (e.g. n8n.yourdomain.com)"
  prompt_if_unset "DASHBOARD_HOST" "Dashboard hostname (e.g. dashboard.yourdomain.com)"
fi

# Write all collected values back to .env
for var in POSTGRES_PASSWORD DASHBOARD_ADMIN_PASSWORD LLM_API_KEY EMBEDDING_API_KEY \
           HUBSPOT_PRIVATE_APP_TOKEN HUBSPOT_PORTAL_ID META_WA_TOKEN META_PHONE_NUMBER_ID \
           SDR_WHATSAPP_NUMBER TELEGRAM_BOT_TOKEN TELEGRAM_OPERATOR_CHAT_ID \
           N8N_HOST DASHBOARD_HOST; do
  val="$(eval echo "\${${var}:-}")"
  if [ -n "${val}" ]; then
    set_env_value "${ENV_PATH}" "${var}" "${val}"
  fi
done

success ".env populated"

# ==============================================================================
# Step 5: Run database migrations
# ==============================================================================
echo ""
info "Starting Postgres for migration..."
cd "${REPO_ROOT}"
docker compose up -d postgres

info "Waiting for Postgres to be healthy..."
RETRIES=30
until docker compose exec -T postgres pg_isready -U ${PROJECT_ID:-exnoria} -d ${POSTGRES_DB:-exnoria} >/dev/null 2>&1; do
  RETRIES=$((RETRIES - 1))
  if [ "${RETRIES}" -eq 0 ]; then
    fatal "Postgres did not become healthy in time"
  fi
  sleep 2
done
success "Postgres is healthy"

info "Running migrations..."

FILTER_MIGRATIONS="${REPO_ROOT}/layers/orchestration/filter/db/migrations"
COGNITIVE_MIGRATIONS="${REPO_ROOT}/layers/cognitive/db/migrations"

run_migration() {
  local file="$1"
  if [ -f "${file}" ]; then
    info "  Applying: $(basename "${file}")"
    docker compose exec -T postgres psql -U ${PROJECT_ID:-exnoria} -d ${POSTGRES_DB:-exnoria} < "${file}" >/dev/null
  fi
}

# Apply in order: 001, 002, 003, etc.
for f in "${FILTER_MIGRATIONS}"/*.sql; do
  run_migration "${f}"
done
for f in "${COGNITIVE_MIGRATIONS}"/*.sql; do
  run_migration "${f}"
done

success "Migrations complete"

# ==============================================================================
# Step 5.5: Admin password bootstrap message
# ==============================================================================
echo ""
info "Checking admin password bootstrap..."

DASHBOARD_ADMIN_PASSWORD="${DASHBOARD_ADMIN_PASSWORD:-}"

if [ -z "${DASHBOARD_ADMIN_PASSWORD}" ]; then
  warn "DASHBOARD_ADMIN_PASSWORD not set in .env"
  warn "After the stack starts, use POST /api/bootstrap/admin-init to set the admin password"
else
  info "DASHBOARD_ADMIN_PASSWORD is set"
  info "The admin password will be initialized automatically when the dashboard container starts"
fi

# ==============================================================================
# Step 7: Start full stack
# ==============================================================================
echo ""
info "Starting full Xnoria stack..."

if [ "${ENV_TARGET}" = "vps" ]; then
  docker compose -f docker-compose.yml -f deploy/environments/vps/docker-compose.override.yml up -d
elif [ "${ENV_TARGET}" = "edge" ]; then
  docker compose -f docker-compose.yml -f deploy/environments/edge/docker-compose.override.yml up -d
else
  docker compose -f docker-compose.yml -f deploy/environments/local/docker-compose.override.yml up -d
fi

success "Stack started"

# ==============================================================================
# Step 8: Run health check
# ==============================================================================
echo ""
info "Running health check..."
sleep 5
"${SCRIPT_DIR}/health-check.sh" || warn "Health check reported failures — check logs above"

# ==============================================================================
# Step 9: Print summary
# ==============================================================================
echo ""
echo -e "${BOLD}════════════════════════════════════════${NC}"
echo -e "${BOLD}  Xnoria Instance Ready${NC}"
echo -e "${BOLD}════════════════════════════════════════${NC}"
echo ""

if [ "${ENV_TARGET}" = "local" ]; then
  echo -e "  n8n:       ${GREEN}http://localhost:5678${NC}"
  echo -e "  Filter:    ${GREEN}http://localhost:3000/health${NC}"
  echo -e "  Dashboard: ${GREEN}http://localhost:4000${NC}"
elif [ "${ENV_TARGET}" = "vps" ] || [ "${ENV_TARGET}" = "edge" ]; then
  N8N_HOST="${N8N_HOST:-<n8n-hostname>}"
  DASHBOARD_HOST="${DASHBOARD_HOST:-<dashboard-hostname>}"
  echo -e "  n8n:       ${GREEN}https://${N8N_HOST}${NC}"
  echo -e "  Dashboard: ${GREEN}https://${DASHBOARD_HOST}${NC}"
  echo -e "  Filter:    Internal only (not exposed externally)"
fi

echo ""
echo -e "  ${YELLOW}Keep your .env secure — it contains secrets.${NC}"
echo -e "  ${YELLOW}Run ./deploy/backup.sh regularly to protect your data.${NC}"
echo ""
