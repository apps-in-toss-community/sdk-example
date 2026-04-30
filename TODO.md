# TODO

## High Priority
(None)

## Medium Priority
- [ ] Deploy to 앱인토스 and capture the production URL
  - [ ] Install/configure `@apps-in-toss/cli` and required manifest files
  - [ ] Reflect the URL in `src/constants.ts` (`APP_IN_TOSS_URL`) so `DemoBanner` renders the QR + link in the web demo
  - [ ] Document the deploy procedure in `DEPLOY.md` (or a section in `CLAUDE.md`)
- [ ] Wire `biome check` into PR CI — CI currently runs `typecheck` + `build`; add a `biome check` step so style regressions surface in PRs.
- [ ] Repo-wide `async () => await foo()` cleanup on `ApiCard` execute props — many existing cards `await` a promise and return it from an `async` arrow, which is redundant (the async wrapper already unwraps). Low-value but stylistically consistent.
- [ ] Polyfill 토글 UI — 현재는 SDK 카드와 polyfill 카드를 나란히 렌더링하는 paired-card 방식. 한 카드에서 "SDK 직접 호출" ↔ "표준 Web API via `@ait-co/polyfill`" 두 경로를 토글로 비교 실행할 수 있는 변형도 고려할 가치가 있다.
- [ ] oidc-bridge auth demo — `AuthPage`에 공용 `oidc-bridge` 인스턴스(또는 self-host) 기반의 표준 OIDC 로그인 흐름 추가. 결정 필요: 공용 인스턴스에 붙일지(rate-limit 있음) vs `.env`로 self-host URL 주입하도록 옵션화할지.

## Low Priority
- [ ] Migrate GitHub Pages to `sdk-example.aitc.dev` custom domain (cross-repo decision; see umbrella `CLAUDE.md` § 운영 도메인 정책).
  - Add `public/CNAME` containing `sdk-example.aitc.dev` (single line, no protocol). `public/` is copied verbatim into `dist/`, so the file lands at the Pages site root.
  - Update `.github/workflows/deploy-pages.yml`: drop the `BASE_PATH: /sdk-example/` env on the `Build` step (or set `BASE_PATH: /`). With sub-domain hosting the app serves from `/`, so `vite.config.ts`'s `base: process.env.BASE_PATH ?? '/'` falls back to root automatically — no `vite.config.ts` change needed.
  - `src/App.tsx:23` reads `BASE_URL` from Vite, which becomes `/` once `BASE_PATH` is gone — react-router routes continue to work without code changes. Worth a smoke test after the cutover.
  - Update README's demo-link wording (anywhere it points at `apps-in-toss-community.github.io/sdk-example/`) and the `aitcc/README.md` reference if it embeds the deployed URL.
  - Add Cloudflare DNS `CNAME sdk-example apps-in-toss-community.github.io.` (DNS-only, no orange-cloud proxy — Pages handles TLS).
  - GitHub Settings → Pages → Custom domain: `sdk-example.aitc.dev`, Enforce HTTPS.
  - Verify `https://sdk-example.aitc.dev/` loads the home page, every domain card navigates correctly, and `og-image.png` resolves at the new origin (OpenGraph absolute URL — check `index.html` meta if any).
  - Coordinate timing with the homepage cutover: homepage's `content/projects.ts` `demoUrl` (`https://apps-in-toss-community.github.io/sdk-example/`) needs to flip to the new URL in the same window.
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
