#!/usr/bin/env bash
# ==============================================================================
# Exnoria — Postgres Backup Script
# deploy/backup.sh
#
# Usage:
#   ./deploy/backup.sh [output-dir]
#
# Default output: ./backups/exnoria_backup_YYYYMMDD_HHMMSS.sql.gz.enc
# Requires BACKUP_PASSPHRASE env var for AES-256 encryption.
# Optionally uploads to S3-compatible bucket if BACKUP_S3_BUCKET is set in .env.
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
PROJECT_ID="${PROJECT_ID:-exnoria}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()    { echo -e "${BLUE}[backup]${NC} $*"; }
success() { echo -e "${GREEN}[backup]${NC} $*"; }
warn()    { echo -e "${YELLOW}[backup]${NC} $*"; }
fatal()   { echo -e "${RED}[backup] ERROR:${NC} $*" >&2; exit 1; }

# Load .env
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

OUTPUT_DIR="${1:-${REPO_ROOT}/backups}"
mkdir -p "${OUTPUT_DIR}"

TIMESTAMP="$(date '+%Y%m%d_%H%M%S')"
BACKUP_BASENAME="${PROJECT_ID}_backup_${TIMESTAMP}"
DUMP_FILE="${OUTPUT_DIR}/${BACKUP_BASENAME}.sql.gz"
ENCRYPTED_FILE="${DUMP_FILE}.enc"

# Require encryption passphrase
if [ -z "${BACKUP_PASSPHRASE:-}" ]; then
  fatal "BACKUP_PASSPHRASE is not set. Export it before running backup.sh:
    export BACKUP_PASSPHRASE='your-secure-passphrase'"
fi

info "Starting Exnoria Postgres backup..."
info "Output: ${ENCRYPTED_FILE}"

# Dump and compress
cd "${REPO_ROOT}"
docker compose exec -T postgres pg_dump -U "${PROJECT_ID}" "${POSTGRES_DB:-exnoria}" | gzip > "${DUMP_FILE}"

if [ ! -s "${DUMP_FILE}" ]; then
  rm -f "${DUMP_FILE}"
  fatal "Backup dump is empty — pg_dump may have failed"
fi

# Encrypt with AES-256-CBC
openssl enc -aes-256-cbc -pbkdf2 -iter 100000 \
  -pass "pass:${BACKUP_PASSPHRASE}" \
  -in "${DUMP_FILE}" \
  -out "${ENCRYPTED_FILE}"

# Remove unencrypted dump
rm -f "${DUMP_FILE}"

BACKUP_SIZE="$(du -sh "${ENCRYPTED_FILE}" | cut -f1)"
success "Backup complete: ${ENCRYPTED_FILE} (${BACKUP_SIZE})"

# Optional S3 upload
if [ -n "${BACKUP_S3_BUCKET:-}" ]; then
  info "Uploading to S3: s3://${BACKUP_S3_BUCKET}/${BACKUP_BASENAME}.sql.gz.enc"

  S3_REGION="${BACKUP_S3_REGION:-us-east-1}"
  S3_ACCESS_KEY="${BACKUP_S3_ACCESS_KEY:-}"
  S3_SECRET_KEY="${BACKUP_S3_SECRET_KEY:-}"

  if [ -z "${S3_ACCESS_KEY}" ] || [ -z "${S3_SECRET_KEY}" ]; then
    warn "S3 credentials not set (BACKUP_S3_ACCESS_KEY / BACKUP_S3_SECRET_KEY) — skipping upload"
  else
    # Use aws CLI if available, otherwise warn
    if command -v aws >/dev/null 2>&1; then
      AWS_ACCESS_KEY_ID="${S3_ACCESS_KEY}" \
      AWS_SECRET_ACCESS_KEY="${S3_SECRET_KEY}" \
      AWS_DEFAULT_REGION="${S3_REGION}" \
        aws s3 cp "${ENCRYPTED_FILE}" \
          "s3://${BACKUP_S3_BUCKET}/${BACKUP_BASENAME}.sql.gz.enc" \
          --region "${S3_REGION}"
      success "Uploaded to s3://${BACKUP_S3_BUCKET}/${BACKUP_BASENAME}.sql.gz.enc"
    else
      warn "aws CLI not found — skipping S3 upload. Install: https://aws.amazon.com/cli/"
    fi
  fi
fi

echo ""
echo "To restore this backup:"
echo "  ./deploy/restore.sh ${ENCRYPTED_FILE}"
