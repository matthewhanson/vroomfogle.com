#!/usr/bin/env bash
set -euo pipefail

# Sync Legacy of the Y'kin chronicles markdown into this repo for the static site.
#
# Usage:
#   ./scripts/sync-legacy-of-the-yinka-chronicles.sh /absolute/path/to/legacy-of-the-yinka
#
# Example:
#   ./scripts/sync-legacy-of-the-yinka-chronicles.sh ../legacy-of-the-yinka

SRC_ROOT="${1:-}"
if [[ -z "$SRC_ROOT" ]]; then
  echo "Usage: $0 /path/to/legacy-of-the-yinka" >&2
  exit 2
fi

if [[ ! -d "$SRC_ROOT/chronicles" ]]; then
  echo "Expected to find: $SRC_ROOT/chronicles" >&2
  exit 2
fi

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="$HERE/content/legacy-of-the-yinka/chronicles"

mkdir -p "$DEST"

rsync -av --delete \
  "$SRC_ROOT/chronicles/" \
  "$DEST/"

echo "Synced chronicles to: $DEST"
