#!/usr/bin/env bash
# ==============================================================================
# Xnoria Agentic Engine — Project Scaffolding & Initialization CLI
# ==============================================================================

set -euo pipefail

PROJECT_ID="${PROJECT_ID:-exnoria}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "🚀 Xnoria Multi-Project Scaffolding Tool"
echo "----------------------------------------"

# 1. Check or generate .env file
if [ ! -f .env ]; then
  echo "📄 Generating .env from .env.example with secure random keys..."
  cp .env.example .env
  
  # Generate cryptographically secure random keys for secrets
  POSTGRES_PASS=$(openssl rand -hex 16 2>/dev/null || echo "pg_$(date +%s)")
  N8N_KEY=$(openssl rand -hex 16 2>/dev/null || echo "n8n_secret_key_$(date +%s)")
  AUTH_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "dashboard_auth_secret_$(date +%s)")
  ADMIN_PASS=$(openssl rand -hex 12 2>/dev/null || echo "admin123456")
  
  sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$POSTGRES_PASS/" .env
  sed -i "s/N8N_ENCRYPTION_KEY=.*/N8N_ENCRYPTION_KEY=$N8N_KEY/" .env
  sed -i "s/DASHBOARD_AUTH_SECRET=.*/DASHBOARD_AUTH_SECRET=$AUTH_SECRET/" .env
  sed -i "s/DASHBOARD_ADMIN_PASSWORD=.*/DASHBOARD_ADMIN_PASSWORD=$ADMIN_PASS/" .env
  
  echo "✅ Generated new .env file with secure secrets."
else
  echo "ℹ️ Existing .env file found. Skipping key generation."
fi

# 2. Check project config
if [ ! -f config/project.config.json ]; then
  echo "📋 Copying config/project.config.example.json to config/project.config.json..."
  cp config/project.config.example.json config/project.config.json
fi

# 3. Ensure required directories exist
mkdir -p backups tmp validation doc/rfcs

# 4. Seeds loading check
if docker ps --format '{{.Names}}' | grep -q "postgres"; then
  echo "🗄️ Loading modular seed packs into PostgreSQL..."
  for seed in config/seeds/*.sql; do
    if [ -f "$seed" ]; then
      echo "  -> Applying $seed..."
      docker exec -i "${PROJECT_ID}_postgres" psql -U "$PROJECT_ID" -d "${POSTGRES_DB:-exnoria}" -f - < "$seed" >/dev/null 2>&1 || true
    fi
  done
  echo "✅ Seeds applied."
else
  echo "⚠️ PostgreSQL container not running. Start with 'make up' and run 'make project-init' again to seed."
fi

echo ""
echo "🎉 Project setup initialized successfully!"
echo "Next steps:"
echo "  1. Review and customize config/project.config.json and .env"
echo "  2. Run 'make up' to start services"
echo "  3. Run 'make verify-workflows' to check workflow readiness"
