# TODO

## High Priority
- [ ] Add ErrorBoundary at `App.tsx` root — SDK calls that throw currently produce a white screen; catch errors, show a recovery UI, log to console

## Medium Priority
- [ ] Deploy to 앱인토스 and capture the production URL
  - [ ] Install/configure `@apps-in-toss/cli` and required manifest files
  - [ ] Reflect the URL in `src/constants.ts` (`APP_IN_TOSS_URL`) so `DemoBanner` renders the QR + link in the web demo
  - [ ] Document the deploy procedure in `DEPLOY.md` (or a section in `CLAUDE.md`)
- [ ] Polish app metadata
  - [ ] `package.json`: proper `name`, `description`, `version`, `author`, `license`
  - [ ] `index.html`: real `<title>`, `<meta name="description">`, OpenGraph tags for social previews
  - [ ] Add an app icon (`public/icon.png` + `<link rel="icon">`)
- [ ] Add ESLint + Prettier
  - [ ] Flat config (`eslint.config.js`) with React, React Hooks, TypeScript rules
  - [ ] `.prettierrc` for formatting consistency
  - [ ] Restore a `lint` script and wire into the new PR CI
- [ ] Real-device UX
  - [ ] Apply `SafeAreaInsets` in `Layout` so content respects notch / home indicator on real devices
  - [ ] Dark mode support (토스 앱 다크 테마 대응)

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
