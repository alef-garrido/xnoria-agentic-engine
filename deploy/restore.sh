#!/usr/bin/env bash
# ==============================================================================
# Xnoria — Postgres Restore Script
# deploy/restore.sh
#
# Usage:
#   ./deploy/restore.sh <backup-file.sql.gz.enc>
#
# Requires BACKUP_PASSPHRASE env var matching the one used during backup.
# WARNING: This OVERWRITES current database data.
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

info()    { echo -e "${BLUE}[restore]${NC} $*"; }
success() { echo -e "${GREEN}[restore]${NC} $*"; }
warn()    { echo -e "${YELLOW}[restore]${NC} $*"; }
fatal()   { echo -e "${RED}[restore] ERROR:${NC} $*" >&2; exit 1; }

BACKUP_FILE="${1:-}"

if [ -z "${BACKUP_FILE}" ]; then
  fatal "Usage: ./deploy/restore.sh <backup-file.sql.gz.enc>"
fi

if [ ! -f "${BACKUP_FILE}" ]; then
  fatal "Backup file not found: ${BACKUP_FILE}"
fi

if [ -z "${BACKUP_PASSPHRASE:-}" ]; then
  fatal "BACKUP_PASSPHRASE is not set. Export it before running restore.sh:
    export BACKUP_PASSPHRASE='your-secure-passphrase'"
fi

# ==============================================================================
# Confirmation
# ==============================================================================
echo ""
echo -e "${RED}${BOLD}⚠ WARNING: This will OVERWRITE all current Xnoria data.${NC}"
echo -e "${YELLOW}Backup file: ${BACKUP_FILE}${NC}"
echo ""
read -r -p "Type RESTORE to confirm: " CONFIRM

if [ "${CONFIRM}" != "RESTORE" ]; then
  info "Restore cancelled"
  exit 0
fi

cd "${REPO_ROOT}"

# ==============================================================================
# Step 1: Stop application containers (prevent writes during restore)
# ==============================================================================
info "Stopping cognitive and filter containers..."
docker compose stop cognitive filter 2>/dev/null || true
success "Application containers stopped"

# ==============================================================================
# Step 2: Decrypt backup
# ==============================================================================
TEMP_DUMP="/tmp/xnoria_restore_$$.sql"

info "Decrypting backup..."
openssl enc -d -aes-256-cbc -pbkdf2 -iter 100000 \
  -pass "pass:${BACKUP_PASSPHRASE}" \
  -in "${BACKUP_FILE}" | gunzip > "${TEMP_DUMP}"

if [ ! -s "${TEMP_DUMP}" ]; then
  rm -f "${TEMP_DUMP}"
  fatal "Decryption/decompression failed — check your BACKUP_PASSPHRASE"
fi

success "Backup decrypted"

# ==============================================================================
# Step 3: Terminate active connections and restore
# ==============================================================================
info "Terminating active database connections..."
docker compose exec -T postgres psql -U xnoria -d postgres -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'exnoria' AND pid <> pg_backend_pid();" \
  >/dev/null 2>&1 || true

info "Dropping and recreating database..."
docker compose exec -T postgres psql -U xnoria -d postgres -c \
  "DROP DATABASE IF EXISTS exnoria;" >/dev/null
docker compose exec -T postgres psql -U xnoria -d postgres -c \
  "CREATE DATABASE exnoria OWNER xnoria;" >/dev/null

info "Restoring from backup..."
docker compose exec -T postgres psql -U xnoria -d exnoria < "${TEMP_DUMP}" >/dev/null
rm -f "${TEMP_DUMP}"

success "Database restored"

# ==============================================================================
# Step 4: Restart all containers
# ==============================================================================
info "Restarting all containers..."
docker compose up -d
sleep 5

success "Containers restarted"

# ==============================================================================
# Step 5: Health check
# ==============================================================================
echo ""
info "Running health check..."
"${SCRIPT_DIR}/health-check.sh" || warn "Health check reported failures — verify manually"

echo ""
success "Restore complete from: ${BACKUP_FILE}"
