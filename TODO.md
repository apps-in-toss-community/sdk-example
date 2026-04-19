# TODO

## High Priority
(None)

## Medium Priority
- [ ] Deploy to 앱인토스 and capture the production URL
  - [ ] Install/configure `@apps-in-toss/cli` and required manifest files
  - [ ] Reflect the URL in `src/constants.ts` (`APP_IN_TOSS_URL`) so `DemoBanner` renders the QR + link in the web demo
  - [ ] Document the deploy procedure in `DEPLOY.md` (or a section in `CLAUDE.md`)
- [ ] Wire `biome check` into PR CI — CI currently runs `typecheck` + `build`; add a `biome check` step so style regressions surface in PRs.
- [ ] Polyfill 토글 UI — 현재는 SDK 카드와 polyfill 카드를 나란히 렌더링하는 paired-card 방식. 한 카드에서 "SDK 직접 호출" ↔ "표준 Web API via `@ait-co/polyfill`" 두 경로를 토글로 비교 실행할 수 있는 변형도 고려할 가치가 있다.
- [ ] oidc-bridge auth demo — `AuthPage`에 공용 `oidc-bridge` 인스턴스(또는 self-host) 기반의 표준 OIDC 로그인 흐름 추가. 결정 필요: 공용 인스턴스에 붙일지(rate-limit 있음) vs `.env`로 self-host URL 주입하도록 옵션화할지.

## Low Priority
- [ ] Set up Vitest + component tests — the repo currently has no test infrastructure; start with render smoke tests for `ApiCard`, `WorkflowStepper`, `HomePage` search filter
- [ ] Playwright smoke tests for the web demo — home search filter, each domain page renders, DemoBanner expand/collapse in web mode
- [ ] QA on real Toss app — verify `DemoBanner` actually hides inside the 토스 앱 (`getOperationalEnvironment() === 'toss'` path); verify real permission flows (not mock)
- [ ] UX niceties
  - [ ] "Copy result" button on `ResultView` — copy JSON output to clipboard
  - [ ] "Clear history" button — the 20-entry cap is enforced in 4 call sites (`ApiCard`, `AdsPage`, `IAPPage`, `EventsPage`); lift the clear control into a shared location rather than duplicating
  - [ ] Loading spinners on `ApiCard` (currently just a "Loading..." label)

## Performance
(None)

## Backlog
- [ ] Workflow templates for new SDK domains — scaffold script that creates a new `XxxPage.tsx` + wires it into `App.tsx` + `HomePage.tsx` to reduce boilerplate
- [ ] i18n — currently mixed Korean/English UI copy; decide on a primary locale and extract strings
- [ ] Docs sync: keep `README.md` domain table in sync when new SDK domains land (could be automated from the `HomePage` `domains` array)
