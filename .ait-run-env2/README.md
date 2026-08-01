# `.ait-run-env2/` — env2 run report provenance

env2(AITC Sandbox PWA 축) 러너가 한 번 남긴 run report 하나만 들어 있는 디렉토리다.
`.gitignore`가 `.ait-run/`만 제외하고 이 경로는 제외하지 않아, 리포트 파일이 git에
tracked 상태로 남았다. 하위 `.ait-capture/`는 `.gitignore`의 `.ait-capture/` 규칙으로
계속 제외된다 — 즉 **이 리포트에 대응하는 capture 레코드는 저장소에 없다**.

## 무엇이 들어 있나

- `2.x.ios-sim.json` — 2026-07-20 실행분(커밋 `be021e5`에서 tracked로 편입).
  `engine.*` 프로브 7 pass / 3 fail. SDK 카테고리 18개 파일은 전부
  `window.__sdk is not installed`(dog-food 빌드가 아니라 브리지 미설치)로 실행되지
  않았다. 이 리포트가 실제로 계측한 것은 **`engine.*` 축뿐**이다.

## 라벨 정정 (#333)

이 파일은 원래 `2.x.ios-pwa.json` / `"platform": "ios-pwa"`였다. `ios-pwa`는
`src/test/aitCapture.ts`의 `Platform` 정의상 **실기기 PWA**(실제 폰의 WebKit) 축을
가리키므로, 그 라벨 자체가 "물리 기기에서 쟀다"는 주장을 담는다.

sdk-example#333의 provenance 감사는 이 실행분이 물리 기기가 아니라 iOS Simulator
기질이었다고 판정하고 라벨을 `ios-sim`으로 정정할 것을 지시했다. 이 디렉토리는 그
지시를 반영한 상태다.

함께 남기는 불확실성:

- **이 파일 자체에는 기질을 증명하는 값이 없다.** userAgent·AppleWebKit 문자열·
  relay/기기 식별자가 리포트에도, (gitignored인) 대응 capture에도 없다 — #333이
  말한 "물리 기기 근거 0"은 이 지점에서 확인된다. 따라서 `ios-sim` 라벨의 근거는
  파일 내용이 아니라 #333의 감사 결론이다.
- 오차 방향은 보수적이다. `ios-sim`은 `ios-pwa`보다 **약한** fidelity 주장이라,
  이 라벨로는 "실기기에서 측정됨"을 주장할 수 없다.

## 이 코퍼스로 말할 수 있는 것 / 없는 것

- 말할 수 있는 것: env1↔env2 `engine.*` 표면 일치는 **Simulator 기준**이다.
- 말할 수 없는 것: "물리 기기 PWA에서 9/9 동치". 물리 기기 PWA `engine.*` 캡처는
  **한 번도 확보되지 않았다**(#333의 남은 작업 (2)).
- 9/9는 shape + boolean 축만 인증한다 — `computedTop`/`dpr`/viewport 같은 스칼라
  값은 대조에 들어가지 않는다(#333). `computedTop`은 호스트 컨테이너(토스 WKWebView
  inset) 속성이라 브라우저 탭·Simulator가 구조적으로 재현하지 못하는 env3-nature다.

## 소비자

이 디렉토리를 읽는 스크립트·테스트는 없다(`ait-run-env2` 문자열 참조 0건).
`pnpm diff:captures`가 읽는 corpus는 `.ait-capture*` 계열이고, 이 리포트는 사람이
읽는 기록이다. 따라서 라벨 정정이 어떤 비교 결과도 바꾸지 않는다.
