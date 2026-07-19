/**
 * engine `.ait.test` — 엔진 감응(engine-sensitive) capability 프로브의 **vitest 경로**.
 *
 * 다른 11개 `.ait.test` 파일은 `@apps-in-toss/web-framework`를 import해 SDK를
 * 호출한다 — env1(vitest)에서는 vitest.config.ts의 alias가 그 import를
 * `@ait-co/devtools/mock`으로 바꿔치므로, 순수 JS로 `aitState`를 읽는 mock이
 * 서빙한다. mock은 어느 엔진에서 돌아도 같은 값을 내므로, 그 11개 파일로
 * env1 ↔ env2(실기기 WebKit) ↔ env3(토스 WebView) 캡처를 대조해도 거의 100%
 * 동치가 나와 판별력이 없다(devtools#774).
 *
 * `engine.*`는 SDK를 아예 import하지 않는다 — `CSS`/`window`/`navigator`/`screen`
 * 같은 런타임 엔진 표면을 직접 찔러 "엔진 성분"만 캡처한다. 프로브 정의는
 * `src/test/engineProbes.ts` **단일 정본**에 있고 이 파일은 그것을 vitest에서
 * 돌릴 뿐이다 — 실 브라우저 경로(`e2e/engine-probes.spec.ts`)와 판정 로직을
 * 공유해야 두 축의 대조가 성립한다.
 *
 * ─ 이 실행분은 env1이 아니다 (기질 축 분리) ────────────────────────────────
 * vitest는 `environment: 'jsdom'`에서 돈다. 그런데 개발자가 실제로 쓰는 env1은
 * jsdom이 아니라 **로컬 Chromium 브라우저**다. 실측 결과 jsdom↔실 WebKit이
 * 갈리는 4건(`safeAreaEnv`·`visualViewport`·`pointerCoarse`·`orientationType`)은
 * **실 Chromium에서도 전부 resolve**한다 — 즉 env1↔env2의 진짜 갭이 아니라
 * jsdom 기질의 인공물이다. 이 실행분을 env1 축으로 쓰면 존재하지 않는 갭 4건을
 * "env1이 env2를 재현 못 함"으로 오보고하게 된다.
 *
 * 그래서 이 파일은 `declareSubstrate('jsdom')`로 자기 축을 **`jsdom`으로 분리**
 * 선언한다. 이 축은 env1↔env2/env3 대조에 쓰지 않으므로 캡처도 diff corpus인
 * `.ait-capture/`가 아니라 `.ait-capture-substrate/engine.<sdkLine>.jsdom.json`
 * 으로 떨어진다 — diff 도구는 디렉토리의 `*.json`을 전부 읽고 platform 축을 보지
 * 않으므로, 같은 디렉토리에 두면 파일명이 갈려 있어도 커버리지 갭을 부풀린다
 * (`aitCapture.ts`의 `SUBSTRATE_ONLY_PLATFORMS` 참조). 남겨두는 목적은 둘이다:
 *   1. CI 회귀 게이트 — `pnpm test`가 CI에서 도는 유일한 계층이라, 프로브가
 *      던지거나(오타·API 오용) 캡처를 못 남기는 회귀를 여기서 잡는다.
 *   2. jsdom 기질 회귀 감시 — jsdom 업그레이드로 capability 표면이 바뀌면 보인다.
 * env1의 진짜 축(`chromium`)은 `e2e/engine-probes.spec.ts`가 만든다.
 *
 * env3(실기기)에서는 러너가 `__AIT_CELL__.platform`(ios/android)을 주입하므로
 * 이 선언은 무시된다 — `declareSubstrate`는 러너 주입보다 우선순위가 낮다.
 *
 * ─ 설계 제약: diff는 값을 비교하지 않는다 ───────────────────────────────────
 * diff가 대조하는 필드는 `outcome`/`errorName`/`errorCode`/`returnType`/
 * `valueKeys`뿐이다 — 값(value) 자체는 레코드에 저장되지 않는다. 따라서
 * "capability 없음"을 boolean 값으로 표현하면 diff에 절대 안 잡힌다. 각 프로브는
 * capability 유무를 resolve/reject 이분으로 인코딩한다(`engineProbes.ts` 참조).
 * 같은 이유로 polyfill 백업 키 감지의 회귀도 diff로는 잡을 수 없다 — 그건 아래
 * `SHIM_TARGET_APIS` 게이트가 단언으로 잡는다.
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */
import { afterAll, describe, expect, it } from 'vitest';
import { declareSubstrate, flushCapture } from '../../test/aitCapture';
import { ENGINE_CATEGORY, ENGINE_PROBES, captureProbeVerdict } from '../../test/engineProbes';

// 이 파일의 vitest 실행분은 jsdom 기질이다 — mock이 서빙하는 11개 카테고리와
// 같은 축('mock')에 섞이면 안 된다. 첫 캡처보다 앞서야 하므로 모듈 최상단에서
// 선언한다. (env3에서는 러너 주입이 이겨 ios/android가 된다.)
declareSubstrate('jsdom');

afterAll(async () => {
  await flushCapture(ENGINE_CATEGORY);
});

/**
 * polyfill이 `navigator` 슬롯을 덮어쓰는 프로브 3종 — 이들만 백업 키를 경유해
 * 엔진 원본을 읽는다(`engineProbes.ts`의 "polyfill 투명성" 참조).
 */
const SHIM_TARGET_APIS = new Set(['engine.share', 'engine.vibrate', 'engine.clipboardApi']);

describe('engine · capability 프로브 (엔진 직접 접근, mock 우회)', () => {
  for (const probe of ENGINE_PROBES) {
    it(`${probe.api} — capture sink에 기록된다`, async () => {
      const { outcome, value } = await captureProbeVerdict(probe, probe.run());

      // 백업 키 감지가 살아 있는지 확인하는 게이트.
      //
      // 위 "diff는 값을 비교하지 않는다" 제약 때문에 프로브가 기록하는
      // `polyfillShimmed` **값**은 캡처 diff에 절대 나타나지 않는다 — 상류
      // polyfill이 `Symbol.for(...)` 백업 키 이름을 바꾸면 프로브는 조용히
      // "안 덮임" 분기로 빠져 다시 shim 값을 엔진 능력으로 오보고하는데,
      // diff는 그 회귀를 영영 말해주지 않는다. 그래서 값이 아니라 **단언**으로
      // 잡는다: polyfill이 로드된 환경이면 shim 대상 프로브는 반드시 백업 키를
      // 찾았어야 한다. 키 이름이 어긋나는 순간 여기서 깨진다.
      //
      // resolve된 경우만 본다 — capability 부재는 errorName 분기라 값이 없다.
      if (SHIM_TARGET_APIS.has(probe.api) && outcome === 'resolved') {
        const polyfillLoaded = Boolean(
          (globalThis as { __AIT_POLYFILL__?: { loaded?: boolean } }).__AIT_POLYFILL__?.loaded,
        );
        expect((value as { polyfillShimmed?: unknown }).polyfillShimmed).toBe(polyfillLoaded);
      }

      if (probe.api === 'engine.devicePixelRatio') {
        // devicePixelRatio는 항상 resolve하는 계약(값 자체가 없는 엔진은 없다고 본다).
        expect(outcome).toBe('resolved');
        return;
      }
      // capability 유무는 기질마다 다른 게 정상(=이 카테고리의 존재 이유) — 여기서는
      // "프로브가 캡처를 남긴다"만 단언하고 resolved/rejected 자체를 단언하지 않는다.
      expect(['resolved', 'rejected']).toContain(outcome);
    });
  }

  it('프로브 정의가 9종 유지된다 (정본 모듈이 비지 않았음)', () => {
    expect(ENGINE_PROBES).toHaveLength(9);
  });
});
