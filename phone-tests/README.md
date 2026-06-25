# phone-tests

실기기 토스 앱 WebView에서 SDK API를 실제로 호출해 검증하는 `*.phone.test.ts` 모음이다. `@ait-co/devtools`의 `run_tests` MCP 도구가 CDP relay로 attach된 실기기에서 이 파일들을 실행한다.

## 로컬 `pnpm test`와 다른 점

이 파일들은 **`pnpm test`(jsdom)로 돌지 않는다.** jsdom에는 실기기도, SDK를 실기기 브리지로 잇는 `window.__sdk`도 없기 때문이다. `vitest.config.ts`의 `exclude`가 `phone-tests/`를 빼므로 로컬 게이트는 이 파일들을 건드리지 않는다.

`describe`/`it`/`expect`는 import하지 않는다 — `run_tests` 런타임이 글로벌로 주입한다. 타입체크용 선언만 `globals.d.ts`에 둔다. SDK import(`@apps-in-toss/web-framework`)는 실행 시 실기기 브리지로 resolve된다.

## 실행 방법

에이전트 안에서 `/ait debug`로 환경 3(intoss-private dogfood)에 relay attach한 뒤 `run_tests`를 호출한다:

```
run_tests({
  files: ["phone-tests/**/*.phone.test.ts"],
  projectRoot: "<repo 루트>"
})
```

attach·QR 스캔 흐름은 `/ait debug` skill이 안내한다. 결과는 파일별 pass/fail/skip + 합산 totals로 돌아온다.

## 파일 구성과 안전 경계

| 파일 | 대상 | 무인 실행 |
|---|---|---|
| `read-only.phone.test.ts` | 조회 API (`getPlatformOS`·`getOperationalEnvironment`·`getServerTime`·`getNetworkStatus`·`getPermission` 등) | 안전 — UI·변이·과금 없음 |
| `interactive.phone.test.ts` | 부작용 API | 사람이 폰 앞에 있어야 함 |

`interactive`의 세 구획:

- **device-state setter** (`setScreenAwakeMode`·`setDeviceOrientation`·`generateHapticFeedback`) — 가역적이고 UI를 막지 않아 무인 실행도 안전. 상태는 복원한다.
- **UI-opening** (`appLogin`·`requestPermission`·`share`·`openURL`·clipboard·`requestReview`) — 실 호출이지만 사용자가 다이얼로그를 탭해야 진행된다. 무인 실행 시 타임아웃으로 끝나며 영구 흔적은 남지 않는다.
- **financial / irreversible** (`checkoutPayment`·`requestTossPayPaysBilling`) — **기본 `it.skip`.** 실 호출 본문은 적어 뒀지만 자동 sweep이 실 결제를 실행하지 못하도록 skip해 둔다. 메인테이너가 테스트 계정으로 직접 폰을 몰 때만 일시적으로 un-skip하고, **un-skip한 채로 커밋하지 않는다.**

## 환경별 fidelity

- **환경 3 (intoss-private dogfood)** — 실 SDK. SDK 동작 검증은 여기서 한다.
- **환경 2 (AITC Sandbox PWA)** — SDK가 mock이라 실 SDK 동작은 검증 불가. DOM·console·타이밍 fidelity만 의미 있다.
- **환경 4 (LIVE)** — `run_tests`에 `confirm: true`가 필요하다(비가역 부작용 guard).

`run_tests`·relay attach 설계는 `/ait debug` skill과 umbrella `meta/four-environments-fidelity.md`가 정본.
