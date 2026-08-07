#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/../layers/dashboard"

files=()
for f in "$@"; do
  files+=("${f#layers/dashboard/}")
done

exec node_modules/.bin/eslint --fix "${files[@]}"