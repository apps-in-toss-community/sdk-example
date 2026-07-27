#!/usr/bin/env bash
# check-debug-build.sh — Regression guard for the in-app debug surface (#361).
#
# Before the 3-package split, `@ait-co/devtools` sat in `dependencies` (in-app
# import) and main.tsx build-time-gated it via a `__DEBUG_BUILD__` Vite
# `define` so plain `pnpm build` / `bundle:ait` fully DCE'd the surface and
# only `bundle:ait:dogfood` (AIT_DEBUG_BUILD=1) kept it. This script used to
# assert that release/dogfood asymmetry (build both channels, diff the two).
#
# Since #361, the in-app surface is `@ait-co/debug-console`'s self-gating
# `/auto` entry (a plain side-effect import in main.tsx, no build-time
# conditional) — that is the package's own documented "recommended" usage.
# By design it no longer guarantees zero bytes in any build channel: the
# dormant chunk is present everywhere and only activates behind the
# package's own runtime gate (host allowlist + `?debug=1` + `relay=` + TOTP).
# So the release/dogfood asymmetry this script used to check no longer
# exists — both channels are identical with respect to debug surface.
#
# What *does* still matter, and what this script checks against `pnpm
# build`'s dist (boilerplate-cleanliness, umbrella §1.4 / issue #361 AC):
#
#   1. positive control — the debug-console self-gating chunk is present.
#      Production builds minify away plain function/variable names (so
#      matching on identifiers like `maybeAttach` is unreliable — verified
#      empirically: they don't survive esbuild/rollup's mangler), but
#      `@ait-co/debug-console`'s own `console.debug` calls bake in a stable
#      `[@ait-co/debug-console]` string-literal log prefix that DOES
#      survive minification, plus its own eruda dependency ships a literal
#      `eruda-` CSS-class prefix in its bundled chunk. Either one guards
#      against someone accidentally dropping the
#      `@ait-co/debug-console/auto` import from main.tsx and silently
#      losing on-device debug attach.
#   2. negative control — no `@ait-co/devtools` / `@ait-co/debugger` runtime
#      code leaks into the production dist. Both are devDependencies only
#      (mock/panel/unplugin + MCP daemon/test runner) and must never be
#      import-reachable from src/. The pattern requires a trailing slash
#      (subpath-import shape, e.g. `@ait-co/devtools/mock`) so it does not
#      false-positive on DemoBanner's UI copy, which legitimately mentions
#      the bare package name ("Web demo running on @ait-co/devtools mock") —
#      that string has no trailing slash and is prose, not a bundled import.
set -euo pipefail

DIST_DIR="dist/assets"
POSITIVE_PATTERN="\[@ait-co/debug-console\]|eruda-"
NEGATIVE_PATTERN="@ait-co/devtools/|@ait-co/debugger/"

if [ ! -d "$DIST_DIR" ]; then
  echo "[check-debug-build] $DIST_DIR not found — run 'pnpm build' first." >&2
  exit 1
fi

# ── positive control: debug-console self-gating surface present ────────────
if grep -rqE "$POSITIVE_PATTERN" "$DIST_DIR" 2>/dev/null; then
  echo "[check-debug-build] ✓ @ait-co/debug-console self-gating surface present in dist"
else
  echo "[check-debug-build] ✗ debug-console surface MISSING from dist — check the '@ait-co/debug-console/auto' import in src/main.tsx"
  exit 1
fi

# ── negative control: devtools/debugger must not leak into the prod bundle ──
if grep -rlE "$NEGATIVE_PATTERN" "$DIST_DIR"/*.js 2>/dev/null | grep -q .; then
  echo "[check-debug-build] ✗ dist LEAKED @ait-co/devtools or @ait-co/debugger — boilerplate-cleanliness violated (umbrella §1.4)"
  exit 1
fi
echo "[check-debug-build] ✓ dist is free of @ait-co/devtools / @ait-co/debugger"
