#!/bin/bash
# Local CI gate — full verification pipeline across all layers
# Replaces the GitHub Actions workflow (dropped 2026-08-06: GH-side startup_failure)
# Run after any change: ./scripts/ci-check.sh
#
# Returns exit code 0 if all layers pass, 1 on the first failure

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "🔍 [1/5] Dashboard — formatting check"
(cd "$REPO_ROOT/layers/dashboard" && npm run format:check)

echo "🔍 [2/5] Dashboard — lint"
(cd "$REPO_ROOT/layers/dashboard" && npm run lint)

echo "🔍 [3/5] Dashboard — typecheck"
(cd "$REPO_ROOT/layers/dashboard" && npm run typecheck)

echo "🔍 [4/5] Dashboard — tests"
(cd "$REPO_ROOT/layers/dashboard" && npm run test)

echo "🔍 [5/5] Dashboard — production build"
(cd "$REPO_ROOT/layers/dashboard" && npm run build)

echo "🔍 Cognitive — build"
(cd "$REPO_ROOT/layers/cognitive" && npm run build)

echo "🔍 Filter — build"
(cd "$REPO_ROOT/layers/orchestration/filter" && npm run build)

echo ""
echo "✅ All layers pass: dashboard (format/lint/typecheck/test/build), cognitive (build), filter (build)"
