# env3 재측정 turnkey 런북

물리 폰 **1회 스캔**으로 env1·env2가 env3를 얼마나 정확히 재현하는지의 남은 잔여를
닫는 절차. 스캔을 뺀 배선은 모두 코드로 준비돼 있어(engine·location·payment 미러가
전부 `*.ait.test.ts` corpus에 있음), 스캔 한 번이 세 잔여를 동시에 친다.

## 지금 상태 (무엇이 남았나)

| 축 | 계측값 | 남은 것 |
|---|---|---|
| env1 ↔ env3 (SDK) | **69/70** (`diff:captures`) | `getCurrentLocation` 1건 — 비결정적 GPS timeout transient |
| env2 ↔ env3 (engine) | iOS-Sim에서 **9/9 표면 + 기기-정확 값** | 같은 계기의 수치화(아래 replay) + env3 engine ground truth |
| safe-area `computedTop` | env2=`0px`(탭 모드) | **닫지 않는다** — 호스트 컨테이너(토스 WKWebView inset) 속성이라 브라우저 탭·Sim이 구조적으로 재현 불가. env3-nature |

`getCurrentLocation`(비결정적 하드웨어)와 safe-area(호스트 컨테이너)는 둘 다 env3의
본성이지 env1/env2의 fidelity 결함이 아니다 — 원리적 천장이다. 스캔이 하는 일은
전자가 정말 transient였는지(70/70) 확인하고, 후자의 실제 env3 값을 관측해 문서화하는 것.

## 0. 전제 (시크릿 취급)

- `AIT_SCHEME_URL`(scheme URL) + `.ait_relay`(TOTP 시크릿)가 있어야 `pnpm test:env3`가 돈다.
- **시크릿·TOTP·relay wss·터널 호스트는 어떤 출력에도 싣지 않는다.** `.ait_relay`/`.ait_urls`
  내용, `at=` 파라미터, `*.trycloudflare.com`, `AIT_TUNNEL_BASE_URL`을 echo/로그 금지.
- 배포(약관 7건 미체결, maintainer 결정)는 이 런북 밖이다 — 여기서는 debug-relay QR
  경로만 다룬다. scheme URL 발급은 tag-gated `deploy-ait.yml`(= `ait deploy --scheme-only`)이
  GitHub Release에 QR로 붙여 주는 것을 쓴다.

## 1. 스캔 → env3 캡처

1. tag-gated deploy가 만든 `intoss-private://…?_deploymentId=…&debug=1&relay=<wss>` deep-link를
   실기기 토스 앱으로 **QR 스캔**한다(수동 변형이라 gate 통과 — cold-load).
2. relay가 붙으면:

   ```bash
   AIT_SCHEME_URL="<scheme-url>" AIT_CELL_SDK_LINE=2.x AIT_CELL_PLATFORM=ios pnpm test:env3
   ```

   → `.ait-run/.ait-capture/`에 전 카테고리 캡처가 떨어진다. 이 한 run이
   `location.ait.test`(getCurrentLocation), `engine.ait.test`(engine ground truth),
   `iap`/`payment`(soft-resolve 미러)를 **모두** 다시 관측한다.

## 2. env1 ↔ env3 verdict (getCurrentLocation 닫힘 확인)

```bash
pnpm diff:captures --a .ait-capture --b .ait-run/.ait-capture
```

- `.ait-capture/`(env1 corpus)가 비어 있으면 먼저 `pnpm test` + `AIT_ENGINE_WEBKIT`/chromium
  e2e로 채운다. 핵심은 `IAP.getCurrentLocation :: …` 키가 **동치**로 잡히는지다 — 잡히면 70/70.
- 안 잡히면 그 한 건은 여전히 비결정적 GPS(accuracy=4 timeout) transient다. 계기를 조작해
  70/70을 만들지 않는다 — 성격을 명시하고 69/70로 둔다.

## 3. env2 ↔ env3 engine verdict (같은 계기로 수치화)

env2(실 iOS WebKit)는 iOS Simulator로 대표한다 — **Dave-MacMini에서 금지**(8GB), Dave-MBP16에
위임(`ssh dave-mbp16.tail91e9e.ts.net`).

```bash
# (MBP16) env2 engine verdict 생성 — 실 iOS WebKit
bash scripts/run-engine-probes-ios-sim.sh            # → .ait-engine-sim/<device>.json

# verdict를 canonical capture로 replay (포맷 drift 차단, aitCapture 정본 경로 재사용)
pnpm tsx scripts/replay-engine-sim-capture.ts .ait-engine-sim/<device>.json .ait-capture-env2

# env3 engine(2단계 산출)과 대조
pnpm diff:captures --a .ait-capture-env2 --b .ait-run/.ait-capture
```

engine 9개 키(`engine.safeAreaEnv` … `engine.orientationType`)가 env2↔env3 동치로 잡히면
"env2는 env3 엔진을 표면+boolean 값까지 재현"이 **수치로** 선다. `.ait-engine-sim/<device>.json`은
`pointerCoarse{coarse,fine}`·`devicePixelRatio{dpr}`·`touchEvents{maxTouchPoints}` full value도
담으므로, safe-area `computedTop` 값(§지금 상태)은 여기서 눈으로 대조한다 — env2 탭 모드 `0px`
vs env3 실기기 inset의 차이는 예상된 호스트-컨테이너 발산이다.

> env2·env3 corpus가 다른 머신에 있으면 `.ait-capture-env2/`(9 레코드) 또는 `.ait-run/.ait-capture/`
> engine 파일만 옮겨 한 곳에서 대조한다 — 둘 다 per-run gitignored라 커밋하지 않는다.

## 4. 무엇을 커밋하나

아무 캡처도 커밋하지 않는다(전부 per-run gitignored: `.ait-capture*`, `.ait-run/`,
`.ait-engine-sim/`). 관측 결과(69/70→70/70 여부, env2↔env3 engine 동치 수)만 이슈/핸드오프에
숫자로 남긴다.
