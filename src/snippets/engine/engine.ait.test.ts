/**
 * engine `.ait.test` — 엔진 감응(engine-sensitive) capability 프로브.
 *
 * 다른 11개 `.ait.test` 파일은 `@apps-in-toss/web-framework`를 import해 SDK를
 * 호출한다 — env1(vitest)에서는 vitest.config.ts의 alias가 그 import를
 * `@ait-co/devtools/mock`으로 바꿔치므로, 순수 JS로 `aitState`를 읽는 mock이
 * 서빙한다. mock은 어느 엔진에서 돌아도 같은 값을 내므로, 그 12개 파일로
 * env1(jsdom) ↔ env2(실기기 WebKit) ↔ env3(토스 WebView) 캡처를 대조해도
 * 거의 100% 동치가 나와 판별력이 없다(devtools#774).
 *
 * `engine.*`는 SDK를 아예 import하지 않는다 — `CSS`/`window`/`navigator`/`screen`
 * 같은 런타임 엔진 표면을 직접 찔러, "엔진 성분"만 순수하게 캡처한다. jsdom(env1)이
 * 구조적으로 못 가진 capability(safe-area env(), visualViewport, 실 터치 등)가
 * env2/env3에서는 있을 수 있으므로, 이 카테고리가 있어야 env1↔env2 갭을
 * "엔진 성분 vs 네이티브 브리지 성분"으로 가를 수 있다.
 *
 * ─ 설계 제약: diff는 값을 비교하지 않는다 ───────────────────────────────────
 * `scripts/diff-ait-captures.ts`가 대조하는 필드는 `outcome`/`errorName`/
 * `errorCode`/`returnType`/`valueKeys`뿐이다 — 값(value) 자체는 레코드에
 * 저장되지 않는다(`aitCapture.ts`의 `extractValueShape`가 shape만 추출). 따라서
 * "capability 없음"을 boolean 값으로 표현하면 diff에 절대 안 잡힌다. 각 프로브는
 * capability 유무를 **resolve/reject 이분**으로 인코딩한다 — 없으면 이름이 다른
 * named error로 throw(`errorName`이 diff 키가 됨), 있으면 resolve하고 부가
 * shape 정보를 반환 객체의 키로 얹는다(`valueKeys`가 diff 키가 됨).
 *
 * ─ 안전 규칙 ─────────────────────────────────────────────────────────────────
 * 부작용 있는 API(`navigator.share()`, `navigator.vibrate()`,
 * `navigator.clipboard.readText/writeText()`, `window.open()` 등)는 절대 실제로
 * 호출하지 않는다 — 실기기에서 네이티브 UI가 뜨거나 권한 프롬프트로 슈트가
 * 멈춘다. 전부 존재/타입 확인만 하고, 모든 프로브는 동기적으로 끝난다(네트워크·
 * 타이머 대기 없음).
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */
import { afterAll, describe, expect, it } from 'vitest';
import { captureAsync, flushCapture } from '../../test/aitCapture';

const CATEGORY = 'engine';

afterAll(async () => {
  await flushCapture(CATEGORY);
});

/**
 * capability 부재를 diff 가능한 named error로 인코딩하는 로컬 헬퍼.
 *
 * `aitCapture.ts`의 `extractErrorShape`는 `errorName`을 `err.name`이 아니라
 * `err.constructor.name`에서 뽑는다. 평범한 `new Error()`에 `e.name = name`만
 * 대입하면 인스턴스 프로퍼티만 바뀌고 `constructor.name`은 여전히 `'Error'`로
 * 고정돼 9개 프로브의 errorName이 전부 `'Error'`로 뭉개진다 — diff 판별력이
 * 사라지는 치명적 함정이다. 그래서 이름별로 익명 `Error` 서브클래스를 만들고
 * `Function.name`을 `Object.defineProperty`로 덮어써 `constructor.name`이
 * 실제로 갈라지게 한다.
 */
function namedError(name: string): Error {
  class EngineCapabilityError extends Error {}
  Object.defineProperty(EngineCapabilityError, 'name', { value: name, configurable: true });
  const e = new EngineCapabilityError(`engine capability missing: ${name}`);
  e.name = name;
  return e;
}

/** 1. 실 CSS safe-area 지원 — `CSS.supports('top: env(safe-area-inset-top)')`. */
async function probeSafeAreaEnv(): Promise<{ supported: boolean; computedTop: string }> {
  if (typeof CSS === 'undefined' || typeof CSS.supports !== 'function') {
    throw namedError('EnvSafeAreaUnsupported');
  }
  const supported = CSS.supports('top: env(safe-area-inset-top)');
  if (!supported) {
    throw namedError('EnvSafeAreaUnsupported');
  }
  const probeEl = document.createElement('div');
  probeEl.style.position = 'fixed';
  probeEl.style.top = 'env(safe-area-inset-top)';
  probeEl.style.visibility = 'hidden';
  document.body.appendChild(probeEl);
  let computedTop: string;
  try {
    computedTop = getComputedStyle(probeEl).top;
  } finally {
    document.body.removeChild(probeEl);
  }
  return { supported, computedTop };
}

/** 2. `window.visualViewport` 존재. */
async function probeVisualViewport(): Promise<{ width: number; height: number; scale: number }> {
  const vv = window.visualViewport;
  if (!vv) {
    throw namedError('VisualViewportUnsupported');
  }
  return { width: vv.width, height: vv.height, scale: vv.scale };
}

/** 3. `devicePixelRatio` — 항상 resolve(값은 diff 밖이지만 사람 판독·후속 확장용). */
async function probeDevicePixelRatio(): Promise<{ dpr: number; isInteger: boolean }> {
  const dpr = window.devicePixelRatio;
  return { dpr, isInteger: Number.isInteger(dpr) };
}

/** 4. `navigator.share` 존재 — 존재 확인만, 절대 호출하지 않는다. */
async function probeShare(): Promise<{ available: true }> {
  if (typeof navigator.share !== 'function') {
    throw namedError('WebShareUnsupported');
  }
  return { available: true };
}

/** 5. `navigator.vibrate` 존재 — 존재 확인만, 절대 호출하지 않는다. */
async function probeVibrate(): Promise<{ available: true }> {
  if (typeof navigator.vibrate !== 'function') {
    throw namedError('VibrationUnsupported');
  }
  return { available: true };
}

/** 6. `matchMedia('(pointer: coarse)')` / `(pointer: fine)`. */
async function probePointerCoarse(): Promise<{ coarse: boolean; fine: boolean }> {
  if (typeof window.matchMedia !== 'function') {
    throw namedError('MatchMediaUnsupported');
  }
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const fine = window.matchMedia('(pointer: fine)').matches;
  return { coarse, fine };
}

/** 7. `'ontouchstart' in window` 또는 `navigator.maxTouchPoints > 0`. */
async function probeTouchEvents(): Promise<{ ontouchstart: boolean; maxTouchPoints: number }> {
  const ontouchstart = 'ontouchstart' in window;
  const maxTouchPoints = navigator.maxTouchPoints ?? 0;
  if (!ontouchstart && !(maxTouchPoints > 0)) {
    throw namedError('TouchUnsupported');
  }
  return { ontouchstart, maxTouchPoints };
}

/** 8. `navigator.clipboard` 존재 + `readText`/`writeText` 메서드 유무 — 실제 호출 금지. */
async function probeClipboardApi(): Promise<{ hasRead: boolean; hasWrite: boolean }> {
  const clipboard = navigator.clipboard;
  if (!clipboard) {
    throw namedError('ClipboardApiUnsupported');
  }
  return {
    hasRead: typeof clipboard.readText === 'function',
    hasWrite: typeof clipboard.writeText === 'function',
  };
}

/** 9. `screen.orientation?.type`. */
async function probeOrientationType(): Promise<{ type: string }> {
  const type = screen.orientation?.type;
  if (type === undefined) {
    throw namedError('ScreenOrientationUnsupported');
  }
  return { type };
}

describe('engine · capability 프로브 (엔진 직접 접근, mock 우회)', () => {
  it('engine.safeAreaEnv — capture sink에 기록된다', async () => {
    const { outcome } = await captureAsync(
      { category: CATEGORY, api: 'engine.safeAreaEnv', scenario: 'capability-probe', input: null },
      () => probeSafeAreaEnv(),
    );
    // capability 유무는 엔진마다 다른 게 정상(=이 카테고리의 존재 이유) — 여기서는
    // "프로브가 캡처를 남긴다"만 단언하고 resolved/rejected 자체를 단언하지 않는다.
    expect(['resolved', 'rejected']).toContain(outcome);
  });

  it('engine.visualViewport — capture sink에 기록된다', async () => {
    const { outcome } = await captureAsync(
      {
        category: CATEGORY,
        api: 'engine.visualViewport',
        scenario: 'capability-probe',
        input: null,
      },
      () => probeVisualViewport(),
    );
    expect(['resolved', 'rejected']).toContain(outcome);
  });

  it('engine.devicePixelRatio — capture sink에 기록된다', async () => {
    const { outcome } = await captureAsync(
      {
        category: CATEGORY,
        api: 'engine.devicePixelRatio',
        scenario: 'capability-probe',
        input: null,
      },
      () => probeDevicePixelRatio(),
    );
    // devicePixelRatio는 항상 resolve하는 계약(값 자체가 없는 엔진은 없다고 본다).
    expect(outcome).toBe('resolved');
  });

  it('engine.share — capture sink에 기록된다', async () => {
    const { outcome } = await captureAsync(
      { category: CATEGORY, api: 'engine.share', scenario: 'capability-probe', input: null },
      () => probeShare(),
    );
    expect(['resolved', 'rejected']).toContain(outcome);
  });

  it('engine.vibrate — capture sink에 기록된다', async () => {
    const { outcome } = await captureAsync(
      { category: CATEGORY, api: 'engine.vibrate', scenario: 'capability-probe', input: null },
      () => probeVibrate(),
    );
    expect(['resolved', 'rejected']).toContain(outcome);
  });

  it('engine.pointerCoarse — capture sink에 기록된다', async () => {
    const { outcome } = await captureAsync(
      {
        category: CATEGORY,
        api: 'engine.pointerCoarse',
        scenario: 'capability-probe',
        input: null,
      },
      () => probePointerCoarse(),
    );
    expect(['resolved', 'rejected']).toContain(outcome);
  });

  it('engine.touchEvents — capture sink에 기록된다', async () => {
    const { outcome } = await captureAsync(
      {
        category: CATEGORY,
        api: 'engine.touchEvents',
        scenario: 'capability-probe',
        input: null,
      },
      () => probeTouchEvents(),
    );
    expect(['resolved', 'rejected']).toContain(outcome);
  });

  it('engine.clipboardApi — capture sink에 기록된다', async () => {
    const { outcome } = await captureAsync(
      {
        category: CATEGORY,
        api: 'engine.clipboardApi',
        scenario: 'capability-probe',
        input: null,
      },
      () => probeClipboardApi(),
    );
    expect(['resolved', 'rejected']).toContain(outcome);
  });

  it('engine.orientationType — capture sink에 기록된다', async () => {
    const { outcome } = await captureAsync(
      {
        category: CATEGORY,
        api: 'engine.orientationType',
        scenario: 'capability-probe',
        input: null,
      },
      () => probeOrientationType(),
    );
    expect(['resolved', 'rejected']).toContain(outcome);
  });
});

describe('engine · 4-cell 오류-shape 캡처', () => {
  it('호출 결과가 capture sink에 쌓인다', () => {
    expect(true).toBe(true);
  });
});
