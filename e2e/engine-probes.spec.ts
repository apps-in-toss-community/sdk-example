/**
 * engine 감응 프로브의 **실 브라우저 경로** — `engine.*` 카테고리의 진짜 env1 축.
 *
 * ─ 왜 vitest가 아니라 여기인가 ──────────────────────────────────────────────
 * `src/snippets/engine/engine.ait.test.ts`는 vitest에서 돌고 vitest는
 * `environment: 'jsdom'`이다. 그런데 개발자가 실제로 쓰는 env1은 jsdom이 아니라
 * **로컬 Chromium 브라우저**다. 실측 결과 jsdom↔실 WebKit이 갈리는 4건
 * (`safeAreaEnv`·`visualViewport`·`pointerCoarse`·`orientationType`)은 실
 * Chromium에서도 전부 resolve한다 — env1↔env2의 진짜 갭이 아니라 jsdom 기질의
 * 인공물이다. 그 실행분을 env1 축으로 쓰면 존재하지 않는 갭 4건을 오보고하므로,
 * jsdom 실행분은 `jsdom` 축으로 분리하고 env1 축은 이 파일이 만든다.
 *
 * ─ 프로브 정의는 여기 없다 ──────────────────────────────────────────────────
 * 판정 로직이 러너마다 두 벌이면 대조가 "엔진 차이"가 아니라 "코드 차이"를 재게
 * 되어 무효다. 프로브는 `src/test/engineProbes.ts` 단일 정본에만 있고, 이 파일은
 * 그것을 `page.evaluate`로 페이지 컨텍스트에 보내 **실행 위치만** 바꾼다.
 * 캡처 레코드 변환(`captureProbeVerdict`)도 같은 정본을 거치므로
 * `outcome`/`errorName`/`valueKeys`가 vitest 경로와 동일한 값으로 떨어진다.
 *
 * ─ 왜 앱 페이지가 아니라 빈 동일-origin 페이지인가 ──────────────────────────
 * `engine.*`의 존재 이유는 **엔진 성분만** 분리해 재는 것이다. dev 서버의 앱
 * 페이지는 `@ait-co/polyfill/auto`(표준 Web API → SDK 라우팅 shim)와 devtools
 * mock이 함께 로드된 상태라, 예컨대 `navigator.clipboard`가 엔진 것인지 polyfill이
 * 깐 shim인지 구분할 수 없다 — 엔진도 네이티브 브리지도 아닌 제3의 교란 성분이
 * 축에 섞인다. 그래서 앱 JS가 전혀 없는 빈 페이지를 쓰되, `about:blank`(불투명
 * origin)가 아니라 **dev 서버와 같은 origin**으로 서빙한다: `navigator.clipboard`
 * 처럼 secure-context에 게이트된 API가 앱의 실제 origin 기준으로 판정되어야 하기
 * 때문이다.
 *
 * ─ 실행 ─────────────────────────────────────────────────────────────────────
 *   pnpm exec playwright test engine-probes                    # chromium (env1 축)
 *   AIT_ENGINE_WEBKIT=1 pnpm exec playwright test engine-probes --project=webkit
 * webkit 프로젝트는 `AIT_ENGINE_WEBKIT=1`일 때만 켜진다(바이너리 설치가 필요해
 * 기본 `pnpm test:e2e`를 깨뜨리지 않기 위함). 산출물은
 * `.ait-capture/engine.<sdkLine>.<chromium|webkit>.json` (gitignored, per-run).
 *
 * 데스크톱 webkit은 env2(실기기 WebKit)의 **근사치일 뿐 대체물이 아니다** —
 * 실기기는 실 뷰포트·실 터치·PWA 셸을 추가로 가지며 그 축은 폰이 있어야 한다.
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */
import { expect, test } from '@playwright/test';
import { declareSubstrate, flushCapture, type Outcome } from '../src/test/aitCapture';
import { captureProbeVerdict, ENGINE_CATEGORY, ENGINE_PROBES } from '../src/test/engineProbes';

/** 앱 JS가 전혀 없는 최소 셸 — 미니앱과 같은 viewport meta만 얹는다. */
const PROBE_PAGE_HTML = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>engine probe</title>
  </head>
  <body></body>
</html>`;

/** dev 서버와 같은 origin이되 서버에 닿지 않는 경로 — route로 가로채 서빙한다. */
const PROBE_PATH = '/__engine-probe.html';

/**
 * Playwright 프로젝트 이름 → 캡처 기질 축.
 * 알 수 없는 프로젝트에서 돌면 축이 조용히 틀린 파일을 만드는 대신 실패시킨다.
 */
function substrateFor(projectName: string): 'chromium' | 'webkit' {
  if (projectName === 'chromium' || projectName === 'webkit') {
    return projectName;
  }
  throw new Error(
    `engine 프로브를 알 수 없는 프로젝트(${projectName})에서 실행했습니다. ` +
      `기질 축을 결정할 수 없어 중단합니다 — chromium 또는 webkit 프로젝트로 실행하세요.`,
  );
}

// 9종 프로브를 한 테스트 안에서 전부 돌린다. `flushCapture`는 모듈 스코프 sink를
// 파일로 내보내는데, 프로브를 여러 test로 쪼개면 `fullyParallel`이 그것들을 서로
// 다른 worker(=서로 다른 모듈 인스턴스)로 흩뿌려 각자 부분 레코드만 담은 파일로
// 덮어쓴다. 단일 test = 단일 sink = 완결된 캡처 파일.
test('engine: capability 프로브 9종을 실 브라우저 엔진에서 캡처한다', async ({
  page,
}, testInfo) => {
  const substrate = substrateFor(testInfo.project.name);
  declareSubstrate(substrate);

  await page.route(`**${PROBE_PATH}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html; charset=utf-8',
      body: PROBE_PAGE_HTML,
    });
  });
  await page.goto(PROBE_PATH);

  const outcomes = new Map<string, Outcome>();
  for (const probe of ENGINE_PROBES) {
    // 프로브 본문이 페이지 컨텍스트에서 실행된다 — verdict는 구조화 복제로 돌아오고,
    // Error 복원과 레코드 변환은 여기(러너 쪽)에서 정본 헬퍼가 담당한다.
    const verdict = await page.evaluate(probe.run);
    const { outcome } = await captureProbeVerdict(probe, verdict);
    outcomes.set(probe.api, outcome);
  }

  await flushCapture(ENGINE_CATEGORY);

  expect(outcomes.size).toBe(9);

  // 실 엔진에서는 항상 존재하는 표면 — jsdom에서만 없다. 이 단언이 깨지면
  // "jsdom↔실 엔진 갈림 4건은 jsdom 인공물"이라는 이 파일의 전제가 무너진 것이다.
  for (const api of [
    'engine.safeAreaEnv',
    'engine.visualViewport',
    'engine.pointerCoarse',
    'engine.orientationType',
    'engine.devicePixelRatio',
  ]) {
    expect(outcomes.get(api), `${api}는 실 브라우저 엔진에서 resolve해야 한다`).toBe('resolved');
  }

  // 나머지 4종(share/vibrate/clipboardApi/touchEvents)은 엔진·컨텍스트마다 갈리는
  // 게 정상이다 — 이 카테고리의 판별력이 거기서 나오므로 outcome을 고정하지 않는다.
});
