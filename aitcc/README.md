# aitcc dog-food assets

This directory is the dog-food test fixture for `console-cli`'s
`aitcc app register` command (tracked as umbrella task #23). It stages
everything needed to submit **sdk-example as a real mini-app on workspace
3095** the first time `aitcc app register` ships.

This is the **first real submit** of the inferred payload shape documented
in `../../.playwright-mcp/FORM-SCHEMA-CAPTURED.md`. It will either confirm
the shape or surface corrections for console-cli #22.

## Contents

- `aitcc.app.yaml` — registration payload (config format defined by #22)
- `assets/logo.png` — 600×600 PNG app logo
- `assets/thumbnail.png` — 1932×828 PNG horizontal thumbnail
- `assets/screenshot-{1,2,3}-*.png` — 636×1048 PNG vertical screenshots (×3, the hard minimum)

No dark-mode logo, no horizontal screenshots, no business-reg-number games.
All fields in `aitcc.app.yaml` match the required/optional split captured
on 2026-04-22.

## Pre-flight (do before submit)

1. Confirm `aitcc app register` is installed and `aitcc whoami` shows workspace 3095:
   ```sh
   aitcc app ls --workspace 3095 --json
   ```
2. Fetch the real category IDs and replace the placeholder in
   `aitcc.app.yaml`'s `categoryIds`:
   ```sh
   # aitcc does not yet expose a `category list` command (not in #22 scope).
   # Temporarily read the response directly:
   curl -sH "Cookie: $(aitcc session cookie)" \
     https://apps-in-toss.toss.im/console/api-public/v3/appsintossconsole/impression/category-list
   ```
   Pick 1–3 IDs that fit sdk-example's purpose (likely "개발자 도구" / "생활" tier).
3. Verify image dimensions locally (the command will do this too, but belt-and-suspenders):
   ```sh
   file assets/*.png
   ```

## Submit

From `sdk-example/aitcc/`:

```sh
aitcc app register --workspace 3095 --config ./aitcc.app.yaml --json \
  | tee submit-$(date +%Y%m%d-%H%M%S).json
```

Capture the XHR response in Playwright/DevTools in parallel — this is the
authoritative record we lacked during spec capture. Save it under
`../../.playwright-mcp/` as `dogfood-23-submit-response.json`.

## Post-submit

- Open the console web UI and verify the app appears in the list for workspace 3095.
- The UI has a separate "검토 요청하기" button for the review-request step.
  That endpoint is explicitly out of scope for #22; file any findings under
  a new task.

## If the submit fails

- `400 invalid-payload`: compare the server error field name with
  `aitcc.app.yaml` and `src/commands/app.ts` payload builder. Feed the diff
  back into console-cli #22 as a follow-up patch.
- `image-dimension-mismatch` locally: check `file assets/*.png` — the PNGs
  in this dir have been verified 600×600 / 1932×828 / 636×1048 at commit time,
  so a mismatch means the files were replaced.

Once a real response is captured, update
`../../.playwright-mcp/FORM-SCHEMA-CAPTURED.md` with "Submit shape confirmed
on 2026-04-YY via dog-food #23" and remove this README's "first real submit"
language.
