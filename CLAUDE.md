# CLAUDE.md

## 프로젝트 성격 (중요)

**`apps-in-toss-community`는 비공식(unofficial) 오픈소스 커뮤니티다.** 토스 팀과 제휴 없음. 사용자에게 보이는 산출물에서 "공식/official/토스가 제공하는/powered by Toss" 등 제휴·후원·인증 암시 표현을 **쓰지 않는다**. 대신 "커뮤니티/오픈소스/비공식"을 사용한다. 의심스러우면 빼라.

## 짝 repo

**sdk-example은 조직의 모든 repo가 수렴하는 downstream consumer / 살아있는 QA 타겟**이다. 각 repo가 완성될 때마다 여기에 통합해서 실제 동작을 증명하는 것이 조직 전체의 dog-fooding 품질 게이트.

- **`devtools`** — SDK mock 제공자. sdk-example은 devtools의 reference consumer.
- **`docs`** — docs의 각 섹션은 sdk-example의 대응 페이지로 deep-link되고, sdk-example의 ApiCard는 docs로 링크한다. 경로 구조 변경 시 반대쪽 링크 체크 필요.
- **`polyfill`** (예정) — 완성되면 표준 Web API 경로로 예제 재작성 또는 토글 옵션 추가.
- **`oidc-bridge`** (예정) — 완성되면 auth 섹션이 실제 로그인 → Supabase/Firebase 세션 흐름까지 데모.
- **`console-cli`** (예정) — 완성되면 GitHub Pages 외에 **앱인토스 실제 미니앱으로도 배포** (E2E 검증용).
- **`agent-plugin`** (예정) — 완성되면 sdk-example 유지보수(새 API 추가, 스크린샷 갱신)를 `/ait` 명령으로 자동화.

## 프로젝트 개요

**sdk-example** — `@apps-in-toss/web-framework` SDK의 모든 public API를 인터랙티브하게 테스트할 수 있는 레퍼런스 앱.
앱 자체가 유효한 사용 예제로 동작하며, 실제 앱인토스에 배포하여 네이티브 환경에서 API를 직접 확인할 수 있다.
개발 시에는 `@ait-co/devtools`의 unplugin이 SDK import를 mock으로 swap해서 토스 앱 없이도 동작한다.

## 기술 스택

- **React 19 + TypeScript** (strict, `noUncheckedIndexedAccess`, `noImplicitOverride`)
- **Vite 6** — dev/build
- **Tailwind CSS v4** — 스타일 (CSS-only, 별도 config 없음)
- **react-router-dom v7** — 페이지 라우팅
- **pnpm** — 패키지 매니저

## 의존성

```
dependencies:
  @apps-in-toss/web-framework   # 원본 SDK (앱인토스 배포 시 사용)
  @ait-co/devtools              # Mock 라이브러리 (개발 시 unplugin이 SDK를 mock으로 alias)
```

개발 중에는 `@ait-co/devtools/unplugin`의 Vite 플러그인이 `@apps-in-toss/web-framework` import를 mock으로 대체한다.
실제 앱인토스 배포 시에는 원본 SDK가 그대로 사용된다.

## 명령어

```bash
pnpm dev          # Vite dev 서버 (기본 :5173)
pnpm build        # tsc --noEmit + vite build → dist/
pnpm preview      # 빌드 결과 미리보기
pnpm typecheck    # tsc --noEmit (SDK export 커버리지 검증 포함)
```

## 프로젝트 구조

```
src/
├── main.tsx               # 엔트리포인트, App 마운트
├── index.css              # Tailwind 지시문
├── App.tsx                # React Router 설정, 16개 라우트
├── __typecheck.ts         # SDK export 커버리지 컴파일 타임 검증
├── components/            # 공유 컴포넌트
│   ├── Layout.tsx             # 모바일 퍼스트 shell (max-w-[430px])
│   ├── PageHeader.tsx         # 뒤로가기 + 제목
│   ├── ApiCard.tsx            # 단일 API 테스트 카드 (generic-typed params)
│   ├── ParamInput.tsx         # 타입별 파라미터 입력 (text/number/toggle/select)
│   ├── ResultView.tsx         # 실행 결과 (성공/에러 뱃지 + JSON)
│   ├── HistoryLog.tsx         # 실행 히스토리 (최대 20개)
│   └── WorkflowStepper.tsx    # 다단계 워크플로우 UI
└── pages/                 # 도메인별 페이지 (16개)
    ├── HomePage.tsx           # 도메인 리스트 + 검색
    ├── AuthPage.tsx           # appLogin, getUserKeyForGame 등
    ├── NavigationPage.tsx     # closeView, openURL, share 등
    ├── EnvironmentPage.tsx    # getPlatformOS, SafeAreaInsets 등
    ├── PermissionsPage.tsx    # getPermission, requestPermission
    ├── StoragePage.tsx        # Storage.setItem/getItem 등
    ├── LocationPage.tsx       # getCurrentLocation, startUpdateLocation
    ├── CameraPage.tsx         # openCamera, fetchAlbumPhotos
    ├── ContactsPage.tsx       # fetchContacts
    ├── ClipboardPage.tsx      # get/setClipboardText
    ├── HapticPage.tsx         # generateHapticFeedback, saveBase64Data
    ├── IAPPage.tsx            # [워크플로우] 상품조회 → 구매 → 주문 관리
    ├── AdsPage.tsx            # [워크플로우] GoogleAdMob, TossAds, FullScreenAd
    ├── GamePage.tsx           # 게임센터, 프로모션, contactsViral
    ├── AnalyticsPage.tsx      # screen, impression, click, eventLog
    ├── PartnerPage.tsx        # addAccessoryButton, removeAccessoryButton
    └── EventsPage.tsx         # graniteEvent, tdsEvent, visibility 구독
```

## 컴포넌트 디자인

### `ApiCard<Params>` — 인터랙티브 API 테스트 기본 단위

- **제네릭 variadic tuple 타입**으로 `params` 정의에서 `execute` 콜백 파라미터 타입을 자동 추론
- `ParamDef<T>`의 `parse?: (raw: string) => T` 필드로 string 입력을 SDK 타입에 맞게 변환
- ex) `{ name: 'amount', type: 'number', parse: (v) => Number(v) }` → `execute` 콜백이 `{ amount: number }` 받음
- 실행 결과는 `ResultView`와 `HistoryLog`가 표시

### `WorkflowStepper` — 다단계 시퀀스 UI

- IAP, Ads처럼 "상품 조회 → 구매 → 주문 관리" 같은 순차 워크플로우 표현
- 스텝 간 자동 진행 + 수동 reset 지원

### `HistoryLog` — 공유 이벤트/실행 로그

- `ApiCard`, `EventsPage`, `AdsPage FullScreen` 등에서 공통으로 사용
- `HistoryEntry { timestamp, status, data?, error? }` 인터페이스

## 코딩 컨벤션

- **SDK 타입 캐스팅은 `ParamDef.parse`로 이동**: 페이지의 `execute` 콜백에서는 타입 assertion 없이 깔끔하게 API 호출
- **이벤트 기반 API**: `onEvent` 콜백이 여러 번 발화되는 API(IAP purchase, AdMob load/show)는 `HistoryLog`에 축적, `ResultView`는 최신 이벤트만 표시 (문서 주석 참고)
- **모바일 퍼스트**: max-w-430px 고정, 데스크톱 브라우저에서도 모바일 뷰 유지
- **공유 컴포넌트 최대 재사용**: 페이지별 중복 로직은 `ApiCard` / `HistoryLog` / `WorkflowStepper`로 추출

## SDK 업데이트 대응

- **빌드 타임 검증**: `src/__typecheck.ts`가 `@apps-in-toss/web-framework`의 모든 public export를 import. 새 export가 추가되었는데 이 파일에 누락되면 `pnpm typecheck` 실패.
- **CI 감지**: `.github/workflows/check-sdk-update.yml`가 매주 월요일에 `@apps-in-toss/web-framework`와 `@ait-co/devtools` 새 버전 확인 → typecheck 실패 시 이슈 자동 생성

## 새 SDK API 페이지 추가 절차

1. `@ait-co/devtools` 업데이트 후 `pnpm typecheck` → `__typecheck.ts`에 누락된 import 추가
2. 새 API가 속한 도메인 페이지(`src/pages/XxxPage.tsx`)에 `ApiCard` 추가
3. 새 도메인이면: `src/pages/NewPage.tsx` 생성, `src/App.tsx`에 라우트 추가, `src/pages/HomePage.tsx`의 `domains` 배열에 엔트리 추가
4. `pnpm typecheck` 통과 확인
5. `pnpm dev`로 브라우저에서 동작 확인

## Playwright MCP를 활용한 QA

Claude Code의 Playwright MCP 플러그인을 사용하면 브라우저를 직접 제어하여 앱의 E2E QA를 수행할 수 있다.

### 사전 준비

1. Claude Code에 Playwright 플러그인이 설치되어 있어야 한다 (`.claude/settings.json`의 `enabledPlugins` 확인)
2. dev 서버 기동: `pnpm install && pnpm dev` (기본 http://localhost:5173)

### QA 절차

1. **홈 로드**: `browser_navigate`로 `http://localhost:5173/` 접속
2. **초기 렌더링 확인**: `browser_snapshot`으로 16개 도메인 카드 표시 확인, 검색 입력 시 필터 동작 확인
3. **각 도메인 페이지 테스트**: 카드 클릭 → 페이지 진입 → API 실행 버튼 클릭 → 결과/히스토리 표시 확인
4. **워크플로우 페이지 테스트**:
   - IAP: 상품 조회 → 상품 선택 → 구매 → 주문 관리 스텝 순차 진행
   - Ads: GoogleAdMob 로드 → 표시, FullScreen 이벤트 로그 확인
5. **EventsPage 구독 테스트**: Back/Home/TDS/Visibility 이벤트 구독 → 트리거 → 이벤트 로그 표시 확인
6. **콘솔 에러 확인**: `browser_console_messages`로 예기치 않은 에러가 없는지 확인

### 주요 Playwright MCP 도구

| 도구 | 용도 |
|---|---|
| `browser_navigate` | URL 이동 |
| `browser_snapshot` | DOM 접근성 트리 (요소 ref 획득, 클릭 대상 식별) |
| `browser_take_screenshot` | 시각적 확인용 스크린샷 |
| `browser_click` | 버튼/요소 클릭 (ref 필요) |
| `browser_evaluate` | JavaScript 실행 (예: localStorage 직접 확인) |
| `browser_console_messages` | 콘솔 로그/에러 확인 |
| `browser_fill_form` | 입력 필드 값 변경 |
| `browser_close` | 브라우저 종료 |

## 외부 참조

- [`@apps-in-toss/web-framework`](https://www.npmjs.com/package/@apps-in-toss/web-framework) — 원본 SDK (토스 팀이 npm에 배포)

짝 repo는 문서 상단 "짝 repo" 섹션 참고. 전체 조직 컨텍스트는 `../CLAUDE.md`(umbrella).
