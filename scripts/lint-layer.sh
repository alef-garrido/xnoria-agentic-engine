#!/usr/bin/env bash
set -euo pipefail

layer="${1:?usage: lint-layer.sh <cognitive|filter> [files...]}"
shift

case "$layer" in
  cognitive) layer_dir="layers/cognitive"; strip_prefix="layers/cognitive/" ;;
  filter) layer_dir="layers/orchestration/filter"; strip_prefix="layers/orchestration/filter/" ;;
  *) echo "unknown layer: $layer" >&2; exit 1 ;;
esac

cd "$(dirname "${BASH_SOURCE[0]}")/../$layer_dir"

files=()
for f in "$@"; do
  files+=("${f#$strip_prefix}")
done

exec node_modules/.bin/eslint --fix "${files[@]}"
