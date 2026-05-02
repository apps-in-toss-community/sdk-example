#!/usr/bin/env bash
# Re-run dog-food after a payload-shape fix lands in console-cli.
#
# Usage:
#   ./rerun-dogfood.sh               # dry-run only (safe)
#   ./rerun-dogfood.sh --live        # real submit — creates a new app on 3095
#
# Before running:
#   - aitcc upgrade   (pick up the fixup release)
#   - aitcc whoami --json | jq .authenticated   → must be true
#   - The appName in aitcc.yaml must be unique on the workspace.

set -euo pipefail

cd "$(dirname "$0")"

mode="${1:-dry}"

check_prereqs() {
  local v
  v="$(aitcc --version 2>&1)"
  echo "aitcc version: $v"
  local ws
  ws="$(aitcc whoami --json 2>/dev/null | jq -r '.workspaces[] | select(.workspaceId == 3095) | .workspaceName')"
  if [ -z "$ws" ]; then
    echo "ERROR: workspace 3095 not in whoami output — re-login or double-check." >&2
    exit 1
  fi
  echo "workspace 3095 visible: $ws"
}

run_dry() {
  echo "--- dry-run ---"
  aitcc app register --workspace 3095 --config ./aitcc.yaml --dry-run --json | jq .
}

run_live() {
  local ts
  ts="$(date +%Y%m%d-%H%M%S)"
  local out="submit-${ts}.json"
  echo "--- live submit (result → $out) ---"
  aitcc app register --workspace 3095 --config ./aitcc.yaml --accept-terms --json \
    | tee "$out"
  echo
  echo "--- verifying persisted row via app ls ---"
  aitcc app ls --workspace 3095 --json | jq '.apps[] | select(.name == "ait-sdk-example" or .name == "ait-sdk-example-2")'
}

check_prereqs
case "$mode" in
  --live) run_live ;;
  *)      run_dry ;;
esac
