#!/bin/bash
# ==============================================================================
# Exnoria · Database initialization script
# Runs on first database creation (via /docker-entrypoint-initdb.d)
# ==============================================================================

set -e

PSQL="psql -v ON_ERROR_STOP=1 -U $POSTGRES_USER -d $POSTGRES_DB"

echo "[init] Starting Exnoria database initialization..."

# Enable pgvector extension
echo "[init] Enabling pgvector extension..."
$PSQL -c "CREATE EXTENSION IF NOT EXISTS vector;" || true

# Apply filter migrations
echo "[init] Applying filter migrations..."
for f in /docker-entrypoint-initdb.d/filter/*.sql; do
    if [ -f "$f" ]; then
        echo "[init] Running: $(basename $f)"
        $PSQL -f "$f" || echo "[init] Note: $(basename $f) may have already been applied"
    fi
done

# Apply cognitive migrations
echo "[init] Applying cognitive migrations..."
if [ -d /docker-entrypoint-initdb.d/cognitive ]; then
    for f in /docker-entrypoint-initdb.d/cognitive/*.sql; do
        if [ -f "$f" ]; then
            echo "[init] Running: $(basename $f)"
            $PSQL -f "$f" || echo "[init] Note: $(basename $f) may have already been applied"
        fi
    done
fi

echo "[init] Database initialization complete!"
