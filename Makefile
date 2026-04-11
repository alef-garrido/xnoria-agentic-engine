# Makefile — Safe Docker Compose Wrapper for Xnoria
#
# NEVER use 'docker compose down -v' directly — use 'make' targets only
# Volumes contain critical data including customer interactions and audit logs

.PHONY: help up down restart rebuild down-hard export-all verify-workflows

# Safe operations — these preserve all volumes and data
up:
	@echo "🚀 Starting Xnoria services..."
	docker compose up -d

# Safe shutdown — preserves all volumes and data
down:
	@echo "🛑 Stopping Xnoria services (preserves volumes)..."
	docker compose down

# Restart services without rebuilding
restart:
	@echo "🔄 Restarting Xnoria services..."
	docker compose restart

# Rebuild and restart services
rebuild:
	@echo "🔨 Rebuilding and restarting Xnoria services..."
	docker compose build && docker compose up -d

# Verify all enabled workflows have corresponding JSON exports
verify-workflows:
	@echo "🔍 Verifying workflow exports..."
	@./scripts/verify-workflows.sh

# Export critical data before any destructive operation
export-all:
	@echo "📦 Exporting critical data..."
	@echo "Exporting n8n workflows (manual step — run 'make verify-workflows' to check)..."
	@mkdir -p backups
	@echo "Backing up filter_log (audit history)..."
	@if docker exec exnoria_postgres true >/dev/null 2>&1; then \
		echo "PostgreSQL container is running..."; \
		if docker exec exnoria_postgres pg_dump -U exnoria -t filter_log $(POSTGRES_DB) > backups/filter_log_$$(date +%Y%m%d_%H%M%S).sql 2>/dev/null; then \
			echo "✅ Export complete. Safe to proceed."; \
		else \
			echo "⚠️  Failed to backup filter_log"; \
		fi; \
	else \
		echo "⚠️  PostgreSQL container is not running — skipping filter_log backup"; \
		echo "Run 'make up' first to start services, then 'make export-all' to backup audit log."; \
	fi

# DESTRUCTIVE operation — destroys all volumes and data
down-hard:
	@echo ""
	@echo "WARNING: WARNING: WARNING: NUCLEAR OPTION WARNING: WARNING: WARNING"
	@echo "This will PERMANENTLY DESTROY:"
	@echo "  • All PostgreSQL data (filter_log, CRM data)"
	@echo "  • All n8n workflows and configuration"
	@echo "  • All Engram contact memory and sessions"
	@echo "  • All backup exports will remain in backups/"
	@echo ""
	@echo "DATA LOSS IS PERMANENT AND UNRECOVERABLE"
	@echo ""
	@echo "Before proceeding:"
	@echo "  1. Run 'make export-all' to backup critical data"
	@echo "  2. Run 'make verify-workflows' to ensure all workflows are exported"
	@echo "  3. Copy any n8n workflows not in source control"
	@echo ""
	@read -p "Type DESTROY to confirm nuclear option: " confirm && [ "$$confirm" = "DESTROY" ]
	@echo "Executing docker compose down -v..."
	docker compose down -v
	@echo "All volumes destroyed. Data loss occurred."

# Display help
help:
	@echo "Xnoria Docker Compose Wrapper"
	@echo ""
	@echo "Safe operations (preserve data):"
	@echo "  make up        - Start services"
	@echo "  make down      - Stop services (SAFE — preserves volumes)"
	@echo "  make restart   - Restart services"
	@echo "  make rebuild   - Rebuild and restart"
	@echo ""
	@echo "Data protection:"
	@echo "  make export-all      - Backup filter_log and critical data"
	@echo "  make verify-workflows - Check all enabled workflows are exported"
	@echo ""
	@echo "DESTRUCTIVE operations (DATA LOSS):"
	@echo "  make down-hard - ⚠️  NUCLEAR OPTION — destroys ALL volumes"
	@echo ""
	@echo "NEVER use 'docker compose down -v' directly. Use 'make' targets only."