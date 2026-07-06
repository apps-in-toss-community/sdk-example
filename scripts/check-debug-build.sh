#!/usr/bin/env bash
# check-debug-build.sh — Regression guard for the __DEBUG_BUILD__ DCE toggle.
#
# Builds both channels and checks that the in-app debug surface
# (Chii relay + eruda + __sdk bridge) is PRESENT in dogfood and ABSENT in
# release. This is the sdk-example mirror of
# devtools/scripts/check-debug-surface-absent.sh: devtools checks that its
# published package fixture has no dormant debug surface; this script checks
# that the deployed .ait artifact correctly includes or excludes it depending
# on the build channel.
#
# Positive control: dogfood .ait MUST contain sentinel identifiers.
# Negative control: release .ait MUST NOT contain sentinel identifiers
#                   (boilerplate-cleanliness, umbrella §1.4).
#
# Root-cause reference: AIT_DEBUG_BUILD env var mismatch (package.json fix,
# #247). Without AIT_DEBUG_BUILD=1 in bundle:ait:dogfood, vite.config.ts
# inlines __DEBUG_BUILD__=false → Rollup DCE removes the entire
# @ait-co/devtools/in-app/auto graph → total silence on real device.
set -euo pipefail

PATTERN="eruda|deriveTargetScriptUrl|installRelayWsObserver|maybeAttach"
BUNDLE="aitc-sdk-example.ait"

# Extract the bundle's JS assets from the .ait (which is a zip with a
# prepended header — the "extra bytes" warning is expected and unzip exits 1
# even on success; we only care about extracted file presence, not unzip's
# exit code). The archive's top-level dir name differs by CLI line: 2.x
# (`@apps-in-toss/cli`) packages under `web/assets/`, 3.0-beta's built-in
# `ait build` (web-framework CLI) packages under `sources/assets/` instead —
# a 3.x cell divergence in the .ait layout itself, not just SDK API shape.
# Try both so this script works unmodified whichever CLI produced the bundle.
extract_js() {
  local dest="$1"
  unzip "$BUNDLE" 'web/assets/*.js' 'sources/assets/*.js' -d "$dest" 2>/dev/null || true
}

# Locate wherever extract_js actually landed the *.js files (web/ or sources/).
find_assets_dir() {
  local root="$1"
  for candidate in "$root/web/assets" "$root/sources/assets"; do
    if ls "$candidate"/*.js >/dev/null 2>&1; then
      echo "$candidate"
      return 0
    fi
  done
  return 1
}

# ── positive control: dogfood ────────────────────────────────────────────────
echo "[check-debug-build] Building dogfood channel (AIT_DEBUG_BUILD=1)..."
pnpm bundle:ait:dogfood

TMPDIR_DOG=$(mktemp -d)
extract_js "$TMPDIR_DOG"
ASSETS_DOG=$(find_assets_dir "$TMPDIR_DOG") || ASSETS_DOG=""

if [ -n "$ASSETS_DOG" ] && grep -rqE "$PATTERN" "$ASSETS_DOG/" 2>/dev/null; then
  echo "[check-debug-build] ✓ dogfood .ait contains in-app debug surface"
else
  echo "[check-debug-build] ✗ dogfood .ait is MISSING in-app debug surface — __DEBUG_BUILD__ toggle is dead"
  exit 1
fi

# ── negative control: release ────────────────────────────────────────────────
echo "[check-debug-build] Building release channel..."
pnpm bundle:ait

TMPDIR_REL=$(mktemp -d)
extract_js "$TMPDIR_REL"
ASSETS_REL=$(find_assets_dir "$TMPDIR_REL") || ASSETS_REL=""

if [ -n "$ASSETS_REL" ] && ls "$ASSETS_REL/"*.js 2>/dev/null | xargs grep -lE "$PATTERN" 2>/dev/null | grep -q .; then
  echo "[check-debug-build] ✗ release .ait LEAKED in-app debug surface — boilerplate-cleanliness violated"
  exit 1
fi
echo "[check-debug-build] ✓ release .ait is free of in-app debug surface"

echo "[check-debug-build] Both controls passed."
