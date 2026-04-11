#!/bin/bash
# ==============================================================================
# Exnoria · Database setup script
# Runs on postgres container startup to apply all migrations
# ==============================================================================

set -e

PSQL="psql -v ON_ERROR_STOP=1 -U $POSTGRES_USER -d $POSTGRES_DB"

echo "[setup] Starting database migrations..."

# Enable pgvector extension
echo "[setup] Enabling pgvector extension..."
$PSQL -c "CREATE EXTENSION IF NOT EXISTS vector;" || true

# Apply filter migrations (in order)
echo "[setup] Applying filter migrations..."
for f in /docker-entrypoint-initdb.d/filter/*.sql; do
    if [ -f "$f" ]; then
        echo "[setup] Running: $(basename $f)"
        $PSQL -f "$f" || echo "[setup] Warning: $f may have already been applied"
    fi
done

# Apply cognitive migrations
echo "[setup] Applying cognitive migrations..."
if [ -d /docker-entrypoint-initdb.d/cognitive ]; then
    for f in /docker-entrypoint-initdb.d/cognitive/*.sql; do
        if [ -f "$f" ]; then
            echo "[setup] Running: $(basename $f)"
            $PSQL -f "$f" || echo "[setup] Warning: $f may have already been applied"
        fi
    done
else
    echo "[setup] No cognitive migrations directory found"
fi

echo "[setup] Database setup complete!"
