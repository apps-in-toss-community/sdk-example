# CLAUDE.md

## 프로젝트 성격 (중요)

`apps-in-toss-community`는 비공식(unofficial) 오픈소스 커뮤니티다. "공식/official/토스가 제공하는/powered by Toss" 등 제휴·후원·인증 암시 표현 금지. 상세는 umbrella [`CLAUDE.md`](https://github.com/apps-in-toss-community/umbrella/blob/main/CLAUDE.md)의 "프로젝트 성격" 참조.

## 프로젝트 개요

**sdk-example** — `@apps-in-toss/web-framework` SDK의 모든 public API를 인터랙티브하게 테스트하는 레퍼런스 앱. 앱 자체가 사용 예제이며, 앱인토스에 배포해 네이티브에서 직접 확인 가능. 개발 시 `@ait-co/devtools`의 unplugin이 SDK import를 mock으로 swap해 토스 앱 없이 동작.

**조직 내 위치**: sdk-example은 모든 repo가 수렴하는 downstream consumer / 살아있는 QA 타겟. 직접 짝은 `devtools`(SDK mock 제공자)와 `docs`(양방향 deep-link, 경로 변경 시 반대쪽 링크 체크 필요). 전체 짝 관계는 umbrella [`CLAUDE.md`](https://github.com/apps-in-toss-community/umbrella/blob/main/CLAUDE.md)의 "짝(pair) 관계" 참조.

## 기술 스택

React 19 + TypeScript strict (`noUncheckedIndexedAccess`, `noImplicitOverride`), Vite 6, Tailwind CSS v4 (CSS-only), react-router-dom v7. 공통 스택(Node, pnpm 버전, Biome 정책 등)은 umbrella [`CLAUDE.md`](https://github.com/apps-in-toss-community/umbrella/blob/main/CLAUDE.md)의 "공통 스택" 참조.

## 의존성

```
@apps-in-toss/web-framework   # 원본 SDK (앱인토스 배포 시 사용)
@ait-co/devtools              # Mock (개발 시 unplugin이 SDK를 alias)
@ait-co/polyfill              # 표준 Web API shim (src/main.tsx에서 auto import)
```

`@ait-co/devtools/unplugin`의 Vite 플러그인이 dev에서 SDK import를 mock으로 대체. 앱인토스 배포 시에는 원본 SDK 그대로 사용. `@ait-co/polyfill/auto`는 `main.tsx`에서 import되어 SDK 미지원 환경에서 표준 Web API 경로를 제공하며, 일부 페이지(예: `LocationPage`)에서 `PolyfillNotice` 컴포넌트로 활성 상태를 표시.

## OIDC bridge URL

`OidcBridgeSection`은 커뮤니티 공용 인스턴스 `https://oidc-bridge.aitc.dev`를 default 상수(`OIDC_BRIDGE_BASE_URL` in `src/components/OidcBridgeSection.tsx`)로 사용. 환경 변수/`.env` 안 씀 — self-host로 가리키려면 상수만 바꿔서 PR.

## 명령어

핵심 5개: `pnpm dev` (Vite, :5173), `pnpm build` (`tsc -b` + `vite build`), `pnpm preview`, `pnpm typecheck` (`tsc --noEmit`, SDK export 커버리지 포함), `pnpm lint`. 전체는 `package.json` 참조.

## 프로젝트 구조

```
src/
├── App.tsx                # React Router 설정, 16개 라우트
├── __typecheck.ts         # SDK export 커버리지 컴파일 타임 검증
├── components/            # Layout, PageHeader, ApiCard, ParamInput,
│                          # ResultView, HistoryLog, WorkflowStepper
└── pages/                 # 16개 도메인 페이지 (Home, Auth, Navigation,
                           # Environment, Permissions, Storage, Location,
                           # Camera, Contacts, Clipboard, Haptic, IAP,
                           # Ads, Game, Analytics, Partner, Events)
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
2. 도메인 페이지(`src/pages/XxxPage.tsx`)에 `ApiCard` 추가
3. 새 도메인이면: `src/pages/NewPage.tsx` 생성, `src/App.tsx` 라우트 추가, `HomePage.tsx`의 `domains` 배열에 엔트리 추가
4. `pnpm typecheck` + `pnpm dev`로 동작 확인

## UI 회귀 검증 (필수)

이 repo의 시각적 산출물(컴포넌트, 페이지, ApiCard, WorkflowStepper)을 변경한 후에는 **반드시 Playwright MCP로 브라우저에서 동작 확인**한다. 단순 prop 변경이라도 렌더 깨짐 가능성 있음. 타입 체크/빌드 통과만으로는 UI 회귀를 못 잡는다 — 시각 검증 없이 "완료" 보고 금지.

워크플로: `pnpm dev` → `browser_navigate` → `browser_snapshot`(DOM/구조 회귀) → `browser_take_screenshot`(시각) → `browser_console_messages`(런타임 에러) → 필요 시 `browser_click`/`browser_fill_form`.

전체 회귀: 홈에서 16개 도메인 카드 + 검색 필터 → 각 페이지 API 실행 → IAP/Ads 워크플로우 → EventsPage 구독 → 콘솔 에러 확인.

## TODO

조직 TODO는 umbrella [`TODO.md`](https://github.com/apps-in-toss-community/umbrella/blob/main/TODO.md)가 single source of truth (이 repo의 `TODO.md`는 stub). PR 머지 시 작성자가 관련 항목 close + 새 follow-up 추가 — 상세는 umbrella [`CLAUDE.md` "TODO 관리"](https://github.com/apps-in-toss-community/umbrella/blob/main/CLAUDE.md#todo-관리--umbrella가-single-source-of-truth).

## 외부 참조

[`@apps-in-toss/web-framework`](https://www.npmjs.com/package/@apps-in-toss/web-framework) — 원본 SDK.
