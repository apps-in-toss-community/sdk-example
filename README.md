# sdk-example

[`@apps-in-toss/web-framework`](https://github.com/apps-in-toss-community/web-framework) SDK의 모든 public API를 인터랙티브하게 테스트할 수 있는 레퍼런스 앱.

- **앱인토스에 배포된 실제 앱**에서 네이티브 환경에서 API 동작을 확인할 수 있다.
- **일반 웹 브라우저**에서도 [`@ait-co/devtools`](https://github.com/apps-in-toss-community/devtools)의 mock 레이어로 토스 앱 없이 개발/테스트할 수 있다.
- 앱 코드 자체가 SDK 사용 예제로 동작한다.

## 지원 SDK 도메인 (16개)

| 도메인 | 주요 API | 패턴 |
|---|---|---|
| Auth | appLogin, getUserKeyForGame 등 | 인터랙티브 폼 |
| Navigation | closeView, openURL, share 등 | 인터랙티브 폼 |
| Environment | getPlatformOS, getNetworkStatus, SafeAreaInsets 등 | 인터랙티브 폼 |
| Permissions | getPermission, requestPermission | 인터랙티브 폼 |
| Storage | setItem, getItem 등 | 인터랙티브 폼 |
| Location | getCurrentLocation, startUpdateLocation | 인터랙티브 폼 |
| Camera & Photos | openCamera, fetchAlbumPhotos | 인터랙티브 폼 |
| Contacts | fetchContacts | 인터랙티브 폼 |
| Clipboard | get/setClipboardText | 인터랙티브 폼 |
| Haptic | generateHapticFeedback, saveBase64Data | 인터랙티브 폼 |
| **IAP** | 상품조회 → 구매 → 주문 관리 | **워크플로우** |
| **Ads** | GoogleAdMob, TossAds, FullScreenAd | **워크플로우** |
| Game | 게임센터, 프로모션, contactsViral | 인터랙티브 폼 |
| Analytics | screen, impression, click, eventLog | 인터랙티브 폼 |
| Partner | addAccessoryButton 등 | 인터랙티브 폼 |
| Events | graniteEvent, tdsEvent, visibility 구독 | 이벤트 구독 |

## 기술 스택

- **React 19** + **TypeScript** (strict)
- **Vite 6** + **Tailwind CSS v4**
- **react-router-dom v7**
- `@apps-in-toss/web-framework` (dev 환경에서 `@ait-co/devtools` mock으로 swap)

## 시작하기

```bash
pnpm install
pnpm dev        # Vite dev 서버 → http://localhost:5173
```

개발 중에는 `@ait-co/devtools`의 unplugin이 `@apps-in-toss/web-framework` import를 mock으로 자동 대체해준다. 토스 앱 없이 브라우저에서 바로 확인 가능하다.

## 명령어

| 명령 | 설명 |
|---|---|
| `pnpm dev` | Vite dev 서버 기동 |
| `pnpm build` | 타입 체크 + 프로덕션 빌드 → `dist/` |
| `pnpm preview` | 빌드 결과 로컬 서빙 |
| `pnpm typecheck` | `tsc --noEmit` (SDK export 커버리지 검증 포함) |
| `pnpm lint` | `biome check .` |
| `pnpm lint:fix` | `biome check --write .` |
| `pnpm format` | `biome format --write .` |

## Pre-commit hook

선택 사항이지만 권장. clone 후 다음 한 줄로 표준 pre-commit hook(스테이지된 파일에 `biome check` 실행)을 활성화한다:

```sh
git config core.hooksPath .githooks
```

push 전에 빠른 피드백을 주기 위한 개발자 편의 장치다. 실제 강제 계층은 CI(`pnpm lint`)이므로, hook을 활성화하지 않은 contributor도 PR 단계에서 lint 실패로 막힌다.

## 프로젝트 구조

```
src/
├── main.tsx               # 엔트리포인트
├── App.tsx                # React Router 설정
├── __typecheck.ts         # SDK export 커버리지 컴파일 타임 검증
├── components/            # 공유 컴포넌트 (Layout, PageHeader, ApiCard, ...)
└── pages/                 # 16개 도메인 페이지
```

자세한 내부 구조와 개발 가이드는 [CLAUDE.md](./CLAUDE.md) 참고.

## 주요 컴포넌트

### `ApiCard<Params>`

각 API 함수를 하나의 인터랙티브 카드로 표시. 제네릭 variadic tuple 타입으로 `params` 정의에서 `execute` 콜백의 파라미터 타입을 자동 추론한다.

```tsx
<ApiCard
  name="Storage.setItem"
  description="값 저장"
  params={[
    { name: 'key', label: 'Key' },
    { name: 'value', label: 'Value' },
  ]}
  execute={async ({ key, value }) => {
    await Storage.setItem(key, value);
  }}
/>
```

### `WorkflowStepper`

여러 API를 순서대로 호출하는 다단계 플로우를 스텝 UI로 표현. IAP의 "상품조회 → 구매 → 주문관리", Ads의 "load → show" 등에 사용.

## SDK 업데이트 대응

- **빌드 타임 검증**: `src/__typecheck.ts`가 `@apps-in-toss/web-framework`의 모든 public export를 import한다. 새 export가 추가되었는데 파일에 누락되면 `pnpm typecheck` 실패.
- **CI 감지**: `.github/workflows/check-sdk-update.yml`이 매주 월요일에 SDK/devtools 새 버전을 감지하고 typecheck 실패 시 이슈를 자동 생성한다.

## 관련 레포

- [`@apps-in-toss/web-framework`](https://github.com/apps-in-toss-community/web-framework) — 원본 SDK
- [`@ait-co/devtools`](https://github.com/apps-in-toss-community/devtools) — mock 라이브러리, unplugin
