# aitcc — AITC.DEV SDK Example mini-app

This directory holds the manifest and assets used to register
**sdk-example as the AITC.DEV SDK Example mini-app on workspace 3095**
via `aitcc app register` (console-cli ≥ v0.1.20).

This is the **final dog-food mini-app** for sdk-example. Subsequent
changes go through `app update` against the resulting `miniAppId` —
do **not** register additional apps. See umbrella
[`CLAUDE.md`](https://github.com/apps-in-toss-community/umbrella/blob/main/CLAUDE.md)
"sdk-example dog-food 앱" section for the full policy.

## Contents

- `aitcc.yaml` — registration manifest (console-cli ≥ v0.1.20 dropped the
  `.app.` token from the filename).
- `assets/logo.png` — 600×600 PNG app logo (AITC mark + `SDK Example`).
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

The CLI does **not** yet expose update mode (`aitcc app register` always
creates). Once it does, run it against the same manifest with the
existing `miniAppId` injected. Until then, edits go through the console
web UI (`/mini-app/<id>/meta/edit`).

REVIEW lock semantics, the `errorCode 4046` branch, and the payload
shape are documented in
[`console-cli/docs/api/mini-apps.md`](https://github.com/apps-in-toss-community/console-cli/blob/main/docs/api/mini-apps.md).

## Re-deriving the brand assets

Source SVGs live in `brand-src/`. Both PNGs must end up at exact
console-enforced dimensions:

```sh
rsvg-convert -w 600  -h 600  brand-src/logo.svg      -o assets/logo.png
rsvg-convert -w 1932 -h 828  brand-src/thumbnail.svg -o assets/thumbnail.png
magick identify assets/*.png    # spot-check dimensions
```

Screenshots are captured live from `pnpm dev` at viewport 636×1048 via
Playwright MCP (see umbrella `meta/brand/README.md` and the parent
repo's UI regression workflow).
