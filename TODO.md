# TODO

## Medium Priority
- [ ] Deploy to 앱인토스 and capture the production URL
  - [ ] Install/configure `@apps-in-toss/cli` and required manifest files
  - [ ] Reflect the URL in `src/constants.ts` (`APP_IN_TOSS_URL`) so `DemoBanner` renders the QR + link in the web demo
  - [ ] Document the deploy procedure in `DEPLOY.md` (or a section in `CLAUDE.md`)
- [ ] Clean up Biome rules currently disabled in `biome.json`
  - Biome is the org-wide standard (see umbrella `../CLAUDE.md`). A few `recommended` rules are turned off here only because existing code predates the adoption. Re-enable each one after fixing the underlying violation.
  - [ ] `suspicious/noArrayIndexKey` — 3 call sites using `index` as React key:
    - `src/components/HistoryLog.tsx:30`
    - `src/components/WorkflowStepper.tsx:23`
    - `src/pages/IAPPage.tsx:88`
    - Fix: derive a stable key (timestamp, id, content hash, etc.) or render via `Fragment` where key isn't needed.
  - [ ] `a11y/noSvgWithoutTitle` — 1 call site:
    - `src/components/PageHeader.tsx:17` (back-arrow icon)
    - Fix: add a non-empty `<title>` inside the `<svg>`, or mark it decorative with `aria-hidden="true"` + a separate `aria-label` on the clickable wrapper.
  - [ ] After both are fixed, remove the two off overrides from `biome.json` and run `pnpm lint` to confirm `recommended` passes clean.

## Low Priority
- [ ] Set up Vitest + component tests — the repo currently has no test infrastructure; start with render smoke tests for `ApiCard`, `WorkflowStepper`, `HomePage` search filter
- [ ] Playwright smoke tests for the web demo — home search filter, each domain page renders, DemoBanner expand/collapse in web mode
- [ ] QA on real Toss app — verify `DemoBanner` actually hides inside the 토스 앱 (`getOperationalEnvironment() === 'toss'` path); verify real permission flows (not mock)
- [ ] UX niceties
  - [ ] "Copy result" button on `ResultView` — copy JSON output to clipboard
  - [ ] "Clear history" button — the 20-entry cap is enforced in 4 call sites (`ApiCard`, `AdsPage`, `IAPPage`, `EventsPage`); lift the clear control into a shared location rather than duplicating
  - [ ] Loading spinners on `ApiCard` (currently just a "Loading..." label)

## Backlog
- [ ] Workflow templates for new SDK domains — scaffold script that creates a new `XxxPage.tsx` + wires it into `App.tsx` + `HomePage.tsx` to reduce boilerplate
- [ ] i18n — currently mixed Korean/English UI copy; decide on a primary locale and extract strings
- [ ] Docs sync: keep `README.md` domain table in sync when new SDK domains land (could be automated from the `HomePage` `domains` array)
