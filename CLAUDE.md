# CLAUDE.md

## 프로젝트 성격 (중요)

`apps-in-toss-community`는 토스/앱인토스 팀과 제휴 관계가 없는 커뮤니티 오픈소스 프로젝트다.

사용자에게 보여지는 모든 산출물(README, UI 카피, 패키지 설명, 커밋/PR 메시지, 코드 주석 등)에서 다음 표현 **금지**:

- "공식(official)", "공식 플러그인/도구", "토스가 제공하는", "앱인토스에서 만든", "powered by Toss"
- 토스와의 제휴/후원/인증을 암시하는 모든 표현

대신 "커뮤니티(community)" 같은 자연스러운 표현. 의심스러우면 빼라.

**톤 가이드** (방어적 disclaimer 금지): README 푸터에 한 줄로 1회만 명시 — `README.md`(한국어)는 `커뮤니티 오픈소스 프로젝트입니다.`, `README.en.md`(영어)는 `Community open-source project.`. "제휴 아님" 같은 방어적 표현 대신 "커뮤니티 오픈소스" 정체성만 자연스럽게. 헤더 직후의 `>` blockquote 박스, ⚠️ 아이콘, 굵은 글씨, `unofficial`/`비공식` 같은 강한 라벨, 한 파일 안에서 영/한 병기는 모두 쓰지 않는다. 기술적 caveat은 disclaimer에 묶지 않고 자연스러운 본문 섹션에 둔다.

**README i18n**: `README.md`(한국어, GitHub default) + `README.en.md`(영어). 두 파일 모두 상단에 상호 link, 동등 정본 — 한 쪽 갱신 시 같은 PR에서 반대쪽도 갱신. `README.md`의 도메인 표는 `scripts/sync-readme-domains.ts`가 생성(손수 편집 금지). `README.en.md`의 도메인 표는 수동 관리 — 도메인 추가/삭제 시 README.md sync 후 README.en.md도 같이 갱신. 자세한 정책은 umbrella `CLAUDE.md` "i18n 정책" 섹션.

## 프로젝트 개요

**sdk-example** — `@apps-in-toss/web-framework` SDK의 모든 public API를 인터랙티브하게 테스트하는 레퍼런스 앱. 앱 자체가 사용 예제이며, 앱인토스에 배포해 네이티브에서 직접 확인 가능. 개발 시 `@ait-co/devtools`의 unplugin이 SDK import를 mock으로 swap해 토스 앱 없이 동작.

**조직 내 위치**: sdk-example은 모든 repo가 수렴하는 downstream consumer / 살아있는 QA 타겟. 직접 짝은 `devtools`(SDK mock 제공자)와 `docs`(양방향 deep-link, 경로 변경 시 반대쪽 링크 체크 필요).

## 기술 스택

React 19 + TypeScript strict (`noUncheckedIndexedAccess`, `noImplicitOverride`), Vite 6, Tailwind CSS v4 (CSS-only), react-router-dom v7.

## 공통 스택 / 개발 환경

- Node 24 LTS, **pnpm 10.33.0** (`packageManager` 고정), TypeScript strict.
- **Biome** (lint + formatter). ESLint/Prettier 사용 안 함. `pnpm lint` / `pnpm lint:fix` / `pnpm format`.
- **Pre-commit hook**: `.githooks/pre-commit`이 source-controlled. contributor가 수동 활성화: `git config core.hooksPath .githooks`. CI `pnpm lint`가 실제 강제 계층, hook은 빠른 피드백.
- **Commit message**: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`).

## 의존성

```
@apps-in-toss/web-framework   # 원본 SDK (앱인토스 배포 시 사용)
@ait-co/devtools              # Mock (개발 시 unplugin이 SDK를 alias)
@ait-co/polyfill              # 표준 Web API shim (src/main.tsx에서 auto import)
```

`@ait-co/devtools/unplugin`의 Vite 플러그인이 dev에서 SDK import를 mock으로 대체. 앱인토스 배포 시에는 원본 SDK 그대로 사용. `@ait-co/polyfill/auto`는 `main.tsx`에서 import되어 SDK 미지원 환경에서 표준 Web API 경로를 제공하며, 일부 페이지(예: `LocationPage`)에서 `PolyfillNotice` 컴포넌트로 활성 상태를 표시.

`pnpm dev:phone` (= `AIT_TUNNEL=1 pnpm dev`)는 devtools unplugin의 `tunnel` 옵션을 켜서 dev 서버를 Cloudflare quick tunnel로 노출하고 공개 URL + ASCII QR을 출력한다 (`vite.config.ts`에서 `tunnel: !!process.env.AIT_TUNNEL`로 env-gate, `pnpm dev`는 그대로 터널 없음). 폰에서 `https://devtools.aitc.dev/launcher/`를 한 번 열어 홈 화면에 추가(Add to Home Screen)한 뒤 QR을 스캔하거나 URL을 붙여넣으면 미니앱이 풀스크린으로 뜬다. `cloudflared` 바이너리는 devtools 의존성이 첫 실행 시 한 번 다운로드해 캐시한다.

dev에서 devtools mock과 polyfill이 동시에 활성화될 때 polyfill은 `getAppsInTossGlobals()`가 truthy를 반환한다는 이유로 SDK를 "present"로 감지하고, `navigator.clipboard.*` 등의 표준 API 호출을 SDK(=devtools mock) 경유로 라우팅한다. 합성 회귀 검증은 devtools#515로 이관.

## Boilerplate 청정성 원칙

`src/`에는 devtools·디버그 환경(CDP relay/attach)·PWA(launcher) 등 메인테이너 인프라 전용 특수 기능을 넣지 않는다. 다른 개발자가 boilerplate/example로 복사해 쓸 수 있어야 하기 때문이다.

**판정 기준**: 일반 미니앱 개발자가 복사해 그대로 가져갈 코드(SDK 사용 예제, 표준 dev 셋업, 공개 패키지의 정상 사용)는 OK — 메인테이너 디버깅·QA 인프라 전용 런타임 코드는 금지(devtools 쪽으로 productize). `vite.config.ts`의 devtools unplugin 옵션과 `dev:phone`(`dev:phone:cdp`) 스크립트는 공개 제품 기능의 표준 사용이라 허용.

## Mini-app 번들 빌드 (`.ait`)

이 repo는 두 산출물을 만든다:

1. **웹 dist** (`pnpm build`) — `tsc -b && vite build && SSG + sitemap`. `sdk-example.aitc.dev` 정적 배포용.
2. **`.ait` 번들** (`pnpm bundle:ait` → `ait build`) — 토스 앱이 로드하는 미니앱 패키지. `granite.config.ts`가 입력, `aitc-sdk-example.ait`가 산출.

번들러는 **`@apps-in-toss/cli`** 패키지의 `ait` bin. `pnpm bundle:ait`는 `ait build`를 실행하고, `bundle:ait:dogfood`는 `RELEASE_CHANNEL=dogfood ait build`를 실행한다.

**`granite.config.ts`** — 미니앱 brand metadata. 핵심 필드:

- `appName: 'aitc-sdk-example'` — 31146의 콘솔 등록명과 일치.
- `brand.primaryColor` — 브랜드 색상.
- `outdir: 'dist'` — 웹 번들 출력 디렉토리.
- `permissions: []` — SDK 호출에 권한 prompt가 필요한 도메인을 여기 추가.

**산출물 / artifacts**

- `aitc-sdk-example.ait` — gitignored.

**Deploy로 가는 prerequisite (2026-05-18 dry-run 캡처)**

`aitcc app deploy <bundle.ait> --workspace 3095 --app 31146 --dry-run`은 우리 console-cli가 번들을 정확히 파싱함을 확인했다(`bundleFormat: ait`, embedded deploymentId 추출 성공). 그러나 실 deploy는 **워크스페이스 약관 7개 미체결**로 차단된 상태:

| Scope | Type | errorCode | 약관 |
|---|---|---|---|
| workspace | TOSS_LOGIN | 4037 | [제휴용] 개인(신용)정보 보안관리 약정서 |
| workspace | TOSS_LOGIN | 4037 | 토스 로그인 약관 |
| workspace | BIZ_WORKSPACE | 4040 | 앱인토스 제휴 서비스 이용약관(제휴사용) |
| workspace | BIZ_WORKSPACE | 4040 | [위탁용] 개인(신용)정보 보안관리 약정서 |
| workspace | BIZ_WORKSPACE | 4040 | 앱인토스 보안점검 약관 |
| workspace | IAA | 4099 | TOSS 광고대행 서비스 이용약관 |
| workspace | IAP | 5001 | 앱인토스 디지털콘텐츠 위탁매매 약관 |

각각 `aitcc workspace terms --type <TYPE>`로 동의 가능 — 단 (주)프로덕트팩토리 사업체 명의의 약관이라 maintainer 결정 필요. 동의 후에야 `aitcc app deploy ... --request-review --release-notes ...`가 통과한다.

## Deploy Key (= 콘솔 "API 키")

앱인토스 콘솔이 "API 키"로 부르는 워크스페이스-scope 자격증명은 이 프로젝트 전반에서 **`Deploy Key`로 부른다** (사용자 노출 텍스트 통일 규칙, umbrella `CLAUDE.md` "용어: Deploy Key" 단락 참고). GitHub secret 이름(`AITCC_API_KEY`)은 외부 인터페이스라 그대로 유지.

운영 중인 Deploy Key: workspace 3095 / scope `aitc-sdk-example` only / id 6905 / name `aitcc-sdk-ex-ci` / expire 2027-05-18.

`.github/workflows/deploy-ait.yml`의 tag-gated deploy는 `ait deploy --api-key "$AITCC_API_KEY" --scheme-only`로 bundle을 업로드하고 반환된 `intoss-private://` URL을 QR PNG + GitHub Release에 담는다. Deploy Key는 `AITCC_API_KEY` GitHub secret으로 주입한다.

**Dog-food 진입**: `ait deploy --scheme-only`가 출력하는 `intoss-private://…` URL을 QR로 스캔해 cold-load한다. 자세한 배경은 umbrella `CLAUDE.md` §3.2 "Dog-food 흐름" 단락 참조.

## On-device 디버깅 (CDP relay + SDK 브리지)

실기기 토스 앱 WebView에 띄운 번들을 에이전트가 사람 폰 관찰 없이 디버깅하는 station 3(debug) 경로. 핵심 인프라 세 가지:

**1. `window.__sdk` / `window.__sdkCall` 브리지** — `@ait-co/devtools/in-app/auto` (`main.tsx`의 single-line import)가 설치한다. `@apps-in-toss/web-framework`의 전체 export namespace를 `window.__sdk`로 노출하고, `window.__sdkCall(name, ...args)`로 임의 SDK API를 호출해 `{ ok, value | error }`를 받는다. 에이전트가 CDP relay의 `Runtime.evaluate`로 직접 구동한다 — 예: `window.__sdkCall('setDeviceOrientation', { type: 'landscape' })`. namespace mirror 패턴이라 새 SDK API가 추가되면 자동 노출되고 2.x·3.x 양쪽에서 동작한다.

- **왜 필요한가**: SDK는 호출을 Granite/ReactNative 브리지(`window.ReactNativeWebView.postMessage` + 독자 envelope)로 라우팅하고, SDK 함수들은 모듈 내부(tree-shaken, global에 안 붙음)다. envelope을 CDP eval로 hand-synthesize할 수 없으므로, 이 브리지 없이는 `setDeviceOrientation` 같은 API를 실기기에서 구동하려면 사람이 UI를 탭해야 한다.
- **self-gate**: `@ait-co/devtools/in-app/auto`는 소비자 번들러가 `import.meta.env.DEV`를 `true`로 치환하는 DEV 빌드이거나 URL에 `?debug=1`/`?relay=`가 있을 때만 활성화된다. 그 외 일반 production load에서는 dormant — `window.__sdk`/`__sdkCall`이 설치되지 않는다.

**2. `ait build`는 real SDK 번들** (mock 아님). `pnpm bundle:ait`(= `ait build`)는 devtools mock alias를 **적용하지 않는다** — 그 alias는 Vite dev 전용 rewrite다. 따라서 on-device 번들의 SDK 호출은 mock이 아니라 진짜 브리지 호출이다. (`pnpm dev` 브라우저에선 같은 import가 mock으로 resolve되지만, dev 서버는 `.ait` 배포와 무관하다.)

**3. QR 스캔 단일 진입** (위 "Deploy Key" 단락 참조). `devicectl`/`adb` 발사 금지. `intoss-private://…?_deploymentId=…&debug=1&relay=<wss>` deep-link를 ASCII QR로 렌더해 폰 카메라로 스캔.

**devtools-debug MCP**는 umbrella·sdk-example **양쪽** `.mcp.json`에 등록돼 있다(둘 다 같은 launcher `~/.local/share/aitc/devtools-mcp-debug.mjs`를 가리킴) → 어느 cwd에서 Claude Code를 띄워도 로드된다. `.mcp.json`은 머신 절대경로가 박혀 있어 **gitignore**(커밋 금지). MCP 도구(`build_attach_url`/`list_pages`/`list_console_messages` 등)로 relay attach·관측한다. MCP 서버가 특정 도구(`measure_safe_area`/`take_screenshot`)를 미구현이면 Chii relay client WS에 직접 붙어 `Runtime.evaluate`로 우회한다(`Page.captureScreenshot`은 chobitsu 미구현이라 스크린샷은 DOM 측정으로 대체).

## OIDC bridge URL

`OidcBridgeSection`은 커뮤니티 공용 인스턴스 `https://oidc-bridge.aitc.dev`를 default 상수(`OIDC_BRIDGE_BASE_URL` in `src/components/OidcBridgeSection.tsx`)로 사용. 환경 변수/`.env` 안 씀 — self-host로 가리키려면 상수만 바꿔서 PR.

## 명령어

핵심: `pnpm dev` (Vite, :5173), `pnpm build` (`tsc -b` + `vite build`), `pnpm preview`, `pnpm typecheck` (`tsc --noEmit`, SDK export 커버리지 포함), `pnpm lint`, `pnpm test` (Vitest 컴포넌트 smoke), `pnpm test:e2e` (Playwright). 전체는 `package.json` 참조.

## 테스트 정책

두 계층:

- **`pnpm test`** — Vitest + `@testing-library/react` + jsdom. 컴포넌트 render/interaction smoke level. 컴포넌트당 1-3 케이스, 빠른 CI 게이트(typecheck/lint 옆). 테스트 파일은 `*.test.{ts,tsx}` 패턴으로 src 옆에. setup은 `src/test/setup.ts` (jest-dom matcher + RTL cleanup).
- **`pnpm test:e2e`** — Playwright. `e2e/`에 위치, 실제 dev 서버에서 브라우저로 실행. 시각적/네비게이션 회귀.

새 컴포넌트 추가 시: render + 핵심 interaction 1개. SDK 자체 호출은 `vi.mock('@apps-in-toss/web-framework')` 또는 devtools mock에 의존. 깊은 단위 테스트는 지양 — sdk-example의 가치는 dog-food이지 라이브러리가 아니므로 테스트는 "렌더 깨짐" 가드 역할만.

## 프로젝트 구조

```
src/
├── App.tsx                # React Router 설정, 19개 라우트 (홈 + 18개 도메인)
├── __typecheck.ts         # SDK export 커버리지 컴파일 타임 검증
├── components/            # Layout, PageHeader, ApiCard, ParamInput,
│                          # ResultView, HistoryLog, WorkflowStepper,
│                          # PolyfillToggleCard, DocsLink
│                          # (전체: src/components/ 참조)
└── pages/                 # 18개 도메인 페이지 (Home, Auth, Navigation,
                           # Environment, Permissions, Storage, Location,
                           # Camera, Contacts, Clipboard, Haptic, IAP,
                           # Ads, Game, Analytics, Partner, Events,
                           # Payment, Notification)
```

## 컴포넌트 디자인

- **`ApiCard<Params>`** — 인터랙티브 API 테스트 기본 단위. 제네릭 variadic tuple로 `params` 정의에서 `execute` 콜백 타입 자동 추론. `ParamDef<T>.parse?: (raw: string) => T`로 string 입력을 SDK 타입으로 변환 (예: `{ name: 'amount', type: 'number', parse: (v) => Number(v) }` → `execute`가 `{ amount: number }` 받음). 결과는 `ResultView` + `HistoryLog`.
- **`WorkflowStepper`** — IAP, Ads처럼 "상품조회 → 구매 → 주문관리" 같은 다단계 시퀀스. 자동 진행 + 수동 reset.
- **`HistoryLog`** — 공유 이벤트/실행 로그. `HistoryEntry { timestamp, status, data?, error? }`. `ApiCard`, `EventsPage`, `AdsPage FullScreen` 등에서 공통 사용.

## 코딩 컨벤션

- SDK 타입 캐스팅은 `ParamDef.parse`로 이동 — 페이지 `execute` 콜백은 type assertion 없이 깔끔하게.
- 이벤트 기반 API(IAP purchase, AdMob load/show처럼 `onEvent`가 여러 번 발화): `HistoryLog`에 축적, `ResultView`는 최신 이벤트만.
- 반응형: 셸은 `max-w-5xl`, 좁은 화면(portrait)은 1컬럼, 넓은 화면(landscape/데스크톱)은 ApiCard를 `sm:grid-cols-2`로 최대 2컬럼. 미니앱 orientation은 portrait/landscape 2값(OS 4방향 아님)이라 landscape에서 화면 폭을 활용해야 한다. 워크플로우/로그 페이지(Ads/IAP/Events)는 시퀀스·로그 흐름 보존 위해 단일 컬럼 유지.
- 페이지별 중복 로직은 `ApiCard` / `HistoryLog` / `WorkflowStepper`로 추출.

## SDK 업데이트 대응

- **빌드 타임 검증**: `src/__typecheck.ts`가 `@apps-in-toss/web-framework`의 모든 public export를 import. 새 export 누락 시 `pnpm typecheck` 실패.
- **CI 감지**: `.github/workflows/check-sdk-update.yml`이 매주 월요일에 `@apps-in-toss/web-framework`와 `@ait-co/devtools` 새 버전 확인 → typecheck 실패 시 이슈 자동 생성.

## 새 SDK API 페이지 추가 절차

1. `@ait-co/devtools` 업데이트 후 `pnpm typecheck` → `__typecheck.ts`에 누락 import 추가
2. **새 도메인이면**: `pnpm scaffold:domain <name> --label "<Display>" --description "..."` 한 번 실행. `src/pages/<Name>Page.tsx` 생성 + `src/App.tsx` 라우트 + `HomePage.tsx` `domains` entry까지 자동 wire (수동 wire 불필요). `--dry-run`으로 plan만 미리 볼 수 있고, 같은 name 재실행은 no-op.
3. 도메인 페이지(`src/pages/XxxPage.tsx`)에 `ApiCard` 추가
4. `pnpm typecheck` + `pnpm dev`로 동작 확인
5. `pnpm sync:readme`로 README 도메인 표 갱신 (잊으면 CI `sync:readme:check`이 잡아줌)

scaffold가 의존하는 BEGIN/END 마커는 `src/App.tsx` (imports/routes)와 `src/pages/HomePage.tsx` (domains 배열)에 있다 — 이 마커를 지우면 scaffold가 fail-fast하니 유지할 것. README는 `<!-- DOMAIN_TABLE_BEGIN -->` ... `<!-- DOMAIN_TABLE_END -->` 사이가 generated이니 손대지 말 것 (`scripts/sync-readme-domains.ts`가 `HomePage.domains`에서 재생성).

## UI 회귀 검증 (필수)

이 repo의 시각적 산출물(컴포넌트, 페이지, ApiCard, WorkflowStepper)을 변경한 후에는 **반드시 Playwright MCP로 브라우저에서 동작 확인**한다. 단순 prop 변경이라도 렌더 깨짐 가능성 있음. 타입 체크/빌드 통과만으로는 UI 회귀를 못 잡는다 — 시각 검증 없이 "완료" 보고 금지.

워크플로: `pnpm dev` → `browser_navigate` → `browser_snapshot`(DOM/구조 회귀) → `browser_take_screenshot`(시각) → `browser_console_messages`(런타임 에러) → 필요 시 `browser_click`/`browser_fill_form`.

전체 회귀: 홈에서 18개 도메인 카드 + 검색 필터 → 각 페이지 API 실행 → IAP/Ads 워크플로우 → EventsPage 구독 → 콘솔 에러 확인.

## 이슈 / 제안

이슈/제안은 GitHub Issues로.

## 외부 참조

[`@apps-in-toss/web-framework`](https://www.npmjs.com/package/@apps-in-toss/web-framework) — 원본 SDK.
