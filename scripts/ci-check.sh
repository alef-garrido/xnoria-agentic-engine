#!/bin/bash
# Local CI gate — full verification pipeline across all layers
# Replaces the GitHub Actions workflow (dropped 2026-08-06: GH-side startup_failure)
# Run after any change: ./scripts/ci-check.sh
#
# Returns exit code 0 if all layers pass, 1 on the first failure

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PRETTIER="$REPO_ROOT/layers/dashboard/node_modules/.bin/prettier"

echo "🔍 [1/11] Dashboard — formatting check"
(cd "$REPO_ROOT/layers/dashboard" && npm run format:check)

echo "🔍 [2/11] Dashboard — lint"
(cd "$REPO_ROOT/layers/dashboard" && npm run lint)

echo "🔍 [3/11] Dashboard — typecheck"
(cd "$REPO_ROOT/layers/dashboard" && npm run typecheck)

echo "🔍 [4/11] Dashboard — tests"
(cd "$REPO_ROOT/layers/dashboard" && npm run test)

echo "🔍 [5/11] Dashboard — production build"
(cd "$REPO_ROOT/layers/dashboard" && npm run build)

echo "🔍 [6/11] Cognitive — formatting check"
"$PRETTIER" --config "$REPO_ROOT/.prettierrc.json" --check \
  "$REPO_ROOT/layers/cognitive/src/**/*.ts" \
  "$REPO_ROOT/layers/cognitive/package.json" \
  "$REPO_ROOT/layers/cognitive/tsconfig.json"

echo "🔍 [7/11] Filter — formatting check"
"$PRETTIER" --config "$REPO_ROOT/.prettierrc.json" --check \
  "$REPO_ROOT/layers/orchestration/filter/src/**/*.ts" \
  "$REPO_ROOT/layers/orchestration/filter/package.json" \
  "$REPO_ROOT/layers/orchestration/filter/tsconfig.json"

echo "🔍 [8/11] Cognitive — lint"
(cd "$REPO_ROOT/layers/cognitive" && npm run lint)

echo "🔍 [9/11] Filter — lint"
(cd "$REPO_ROOT/layers/orchestration/filter" && npm run lint)

echo "🔍 [10/11] Cognitive — build"
(cd "$REPO_ROOT/layers/cognitive" && npm run build)

echo "🔍 [11/11] Filter — build"
(cd "$REPO_ROOT/layers/orchestration/filter" && npm run build)

echo ""
echo "✅ All layers pass: dashboard (format/lint/typecheck/test/build), cognitive (format/lint/build), filter (format/lint/build)"
