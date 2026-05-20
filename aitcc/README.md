# aitcc — AITC.DEV SDK Example mini-app

This directory holds the manifest and assets used to register
**sdk-example as the AITC.DEV SDK Example mini-app on workspace 3095**
via `aitcc app register` (console-cli ≥ v0.1.20).

This is the **final dog-food mini-app** for sdk-example. Subsequent
changes go through `app update` against the resulting `miniAppId` —
do **not** register additional apps.

## Contents

- `aitcc.yaml` — registration manifest (console-cli ≥ v0.1.20 dropped the
  `.app.` token from the filename).
- `assets/logo.png` — 600×600 PNG app logo (AITC mark + `SDK Example`).
  Apps in Toss 브랜딩 가이드 참고 — **각진 정사각형** (모서리
  둥글림 없음, alpha flatten된 RGB). 가이드:
  <https://developers-apps-in-toss.toss.im/design/miniapp-branding-guide.html>
- `assets/thumbnail.png` — 1932×828 PNG horizontal thumbnail (AITC.DEV
  banner, `aitc.dev` brand color, tagline).
- `assets/screenshot-{1,2,3}-*.png` — 636×1048 PNG vertical screenshots
  (×3, the hard minimum). All three include the AITC.DEV BrandMark
  header from the live app.
- `brand-src/{logo,thumbnail}.svg` — vector source for the PNGs above.
  Re-derive with `rsvg-convert` (or `magick`) if the brand evolves.
- `rerun-dogfood.sh` — convenience wrapper for dry-run / live submit.

## Register / re-register

```sh
# 1. Make sure the workspace context + session are ready.
pnpm dlx @ait-co/console-cli@latest workspace use 3095
pnpm dlx @ait-co/console-cli@latest whoami --json | jq .authenticated

# 2. Dry-run (validates manifest + image dimensions, hits no server).
pnpm dlx @ait-co/console-cli@latest app register \
  --config ./aitcc/aitcc.yaml --dry-run --json | jq .

# 3. Real registration (workspace 3095 OWNER session required).
pnpm dlx @ait-co/console-cli@latest app register \
  --config ./aitcc/aitcc.yaml --accept-terms --json \
  | tee submit-$(date +%Y%m%d-%H%M%S).json

# 4. Confirm review queue entry.
pnpm dlx @ait-co/console-cli@latest app status <new-miniAppId> --json | jq .
```

## Updating

`aitcc app register` runs in update mode when the manifest carries an
existing `miniApp.miniAppId` in the submit payload — register against
the same `aitcc.yaml` with `miniAppId: 31146` set and it applies the
change to the existing app instead of creating a new one. Do **not**
register a fresh app to push edits.

If the app is mid-review the update returns `errorCode 4046` (REVIEW
lock); in that case wait for the ops team to clear the queue rather than
working around it with a new registration.

REVIEW lock semantics, the `errorCode 4046` branch, and the payload
shape are documented in
[`console-cli/docs/api/mini-apps.md`](https://github.com/apps-in-toss-community/console-cli/blob/main/docs/api/mini-apps.md).

## Re-deriving the brand assets

Source SVGs live in `brand-src/`. Both PNGs must end up at exact
console-enforced dimensions:

```sh
rsvg-convert -w 600  -h 600  brand-src/logo.svg      -o assets/logo.png
rsvg-convert -w 1932 -h 828  brand-src/thumbnail.svg -o assets/thumbnail.png
# logo는 각진 정사각형 + alpha flatten 필수 (RGBA 잔여물 NG):
magick assets/logo.png -background "#3182f6" -flatten -type TrueColor assets/logo.png
magick identify assets/*.png    # spot-check dimensions
```

Screenshots are captured live from `pnpm dev` at viewport 636×1048 via
Playwright MCP (see the UI regression workflow in this repo's
`CLAUDE.md`).
