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

dev에서 devtools mock과 polyfill이 동시에 활성화될 때 polyfill은 `getAppsInTossGlobals()`가 truthy를 반환한다는 이유로 SDK를 "present"로 감지하고, `navigator.clipboard.*` 등의 표준 API 호출을 SDK(=devtools mock) 경유로 라우팅한다. 이 합성을 sdk-example에서 명시적으로 가시화/회귀 검증하기 위해 `EnvironmentPage` 상단에 `ShimCompositionCard`를 둔다 (writeText round-trip이 `window.__ait` mock state를 갱신하는지 확인). e2e는 `e2e/shim-composition.spec.ts`.

## Mini-app 번들 빌드 (`.ait`)

이 repo는 두 산출물을 만든다:

1. **웹 dist** (`pnpm build`) — `tsc -b && vite build && SSG + sitemap`. `sdk-example.aitc.dev` 정적 배포용.
2. **`.ait` 번들** (`pnpm bundle:ait` → `ait build`) — 토스 앱이 로드하는 미니앱 패키지. `granite.config.ts`가 입력, `aitc-sdk-example.ait`가 산출.

번들러는 **`@apps-in-toss/cli@2.5.2`** (공식 도구, dev dep). `ait build`는 `vite build`를 한 번 더 돌려 dist를 만들고 `AITBUNDL` magic + protobuf 헤더 + zip blob 포맷으로 wrap한다. 빌드 시 두 RN target(0.84.0 + 0.72.6)에 대해 산출.

**`granite.config.ts`** — 미니앱 brand metadata + web build wiring. 핵심 필드:

- `appName: 'aitc-sdk-example'` — 31146의 콘솔 등록명과 일치.
- `brand.icon` — **`string` (URL) 필수**. `null` 주면 schema validation에서 fail (메시지는 `[Apps In Toss Plugin] 플러그인 옵션이 올바르지 않습니다.`로 추상적이라 발견 시간을 잡아먹는다).
- `web.commands.build: 'vite build'` — sdk-example의 정식 `pnpm build`는 `tsc -b && vite build && SSG + sitemap`이지만, mini-app 번들에는 SSG/sitemap이 무의미하므로 vite build만 호출. 타입 체크가 따로 필요한 contributor는 `pnpm typecheck`를 별도 단계로 돌릴 것.
- `permissions: []` — 처음 빌드 통과용 placeholder. SDK 호출에 권한 prompt가 필요한 도메인을 dog-food하려면 여기 추가.

**산출물 / artifacts**

- `aitc-sdk-example.ait` (~4 MB) — gitignored.
- `.granite/app.json` — 빌드 메타. gitignored.

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

앱인토스 콘솔이 "API 키"로 부르는 워크스페이스-scope 자격증명은 이 프로젝트 전반에서 **`Deploy Key`로 부른다** (사용자 노출 텍스트 통일 규칙, umbrella `CLAUDE.md` "용어: Deploy Key" 단락 참고). CLI flag(`ait deploy --api-key`)와 GitHub secret 이름(`AITCC_API_KEY`)은 외부 인터페이스라 그대로 유지.

운영 중인 Deploy Key: workspace 3095 / scope `aitc-sdk-example` only / id 6905 / name `aitcc-sdk-ex-ci` / expire 2027-05-18. 평소 deploy 흐름은 `pnpm bundle:ait` → `pnpm exec ait deploy --api-key "$AITCC_API_KEY" --scheme-only -m "<memo>"` (stdout 마지막 줄이 `intoss-private://...` URL). GitHub Actions의 tag-gated workflow가 이 흐름을 자동화한다 — `.github/workflows/deploy-ait.yml` 참고.

**Dog-food는 PREPARE 단계에선 `test-push`로**: 31146의 `serviceStatus`가 `PREPARE`(출시 review 통과 전)인 동안은 intoss-private URL을 폰에서 열어도 토스 앱이 actual bundle을 load하지 않는다 (`aitcc app bundles deployed`가 `null` 반환). 그 동안은 `aitcc app bundles test-push --workspace 3095 --app 31146 --deployment-id <id>`로 uploader 디바이스에 push를 보내고, 그 알림을 통해 bundle을 load해야 한다. v0.1.1에서 처음 확인됨 — 자세한 배경은 umbrella `CLAUDE.md` "Dog-food 흐름" 단락 참조.

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
├── App.tsx                # React Router 설정, 18개 라우트
├── __typecheck.ts         # SDK export 커버리지 컴파일 타임 검증
├── components/            # Layout, PageHeader, ApiCard, ParamInput,
│                          # ResultView, HistoryLog, WorkflowStepper
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
- 모바일 퍼스트: `max-w-[430px]` 고정, 데스크톱 브라우저에서도 모바일 뷰 유지.
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
