/**
 * engine 감응 프로브 **단일 정본** — vitest(jsdom)·Playwright(실 브라우저)·
 * env3(실기기 WebView) 세 러너가 모두 이 파일의 정의 하나를 공유한다.
 *
 * ─ 왜 단일 정본이어야 하나 ──────────────────────────────────────────────────
 * 이 카테고리의 존재 이유는 축이 다른 실행분끼리 `outcome`/`errorName`을
 * 대조하는 것이다. 판정 로직이 러너마다 두 벌이면 그 대조는 "엔진 차이"가
 * 아니라 "코드 차이"를 재게 되어 비교 자체가 무효가 된다. 그래서 프로브 본문은
 * 여기 한 번만 쓰고, 러너는 그것을 **실행할 위치**만 고른다.
 *
 * ─ self-contained 제약 (page.evaluate 직렬화) ───────────────────────────────
 * Playwright 경로는 `page.evaluate(probe.run)`으로 프로브를 페이지 컨텍스트에
 * 보낸다. `page.evaluate`는 함수를 **소스 문자열로 직렬화**해 전송하므로,
 * `run` 본문은 모듈 스코프의 어떤 식별자도 클로저로 잡으면 안 된다(잡으면
 * 페이지에서 `ReferenceError`). 따라서 각 `run`은 `CSS`/`window`/`navigator`/
 * `screen`/`document` 같은 **표준 전역만** 참조한다 — 헬퍼 함수 호출, 상수
 * 참조, import 모두 금지다. 프로브를 추가할 때 이 제약을 반드시 지킬 것.
 *
 * ─ 왜 throw가 아니라 verdict 객체를 반환하나 ────────────────────────────────
 * `page.evaluate`의 반환값은 구조화 복제(structured clone)로 넘어온다 — Error
 * 객체는 그대로 건너오지 못하고, `aitCapture`가 판별에 쓰는
 * `err.constructor.name`은 더더욱 보존되지 않는다. 그래서 프로브는 페이지
 * 안에서 던지지 않고 `{ ok, ... }` 평범한 객체(verdict)를 반환하고, 그 verdict를
 * **러너 쪽(Node/테스트 컨텍스트)에서** `settleProbeVerdict`가 다시
 * resolve/reject로 되살린다. `namedError`도 러너 쪽에서 돌므로
 * `constructor.name` 성질이 세 경로 모두에서 동일하게 보존된다 —
 * 결과적으로 `outcome`/`errorName`/`valueKeys`가 러너와 무관하게 같은 값이 된다.
 *
 * ─ 안전 규칙 ────────────────────────────────────────────────────────────────
 * 부작용 있는 API(`navigator.share()`, `navigator.vibrate()`,
 * `navigator.clipboard.readText/writeText()`, `window.open()`)는 절대 실제로
 * 호출하지 않는다 — 실기기에서 네이티브 UI나 권한 프롬프트가 떠 슈트가 멈춘다.
 * 전부 존재/타입 확인만 하고, 모든 프로브는 동기적으로 끝난다.
 *
 * ─ polyfill 투명성 (env3 비대칭 방지) ────────────────────────────────────────
 * `src/main.tsx` 최상단의 `@ait-co/polyfill/auto` import는 `ait build`가 그대로
 * 번들에 넣으므로, env3(실기기 토스 앱 WebView)는 항상 polyfill이 활성인 채로
 * 실행된다. env1/env2는 polyfill 없는 페이지에서 같은 값을 잰다. `engine.share`
 * / `engine.vibrate` / `engine.clipboardApi`는 polyfill이 `navigator`의 해당
 * 슬롯을 shim으로 덮어쓰므로, 덮인 채로 값을 읽으면 "엔진 능력"이 아니라
 * "polyfill 설치 여부"를 재게 되어 env3만 비대칭으로 왜곡된다. polyfill의 각
 * shim은 패치 **전에** 네이티브 원본을 `Symbol.for('@ait-co/polyfill/<api>.original')`
 * 전역 심볼 키로 `navigator`에 백업해 둔다 — 이 세 프로브는 그 키가 존재하면
 * 백업값을, 없으면 `navigator`를 직접 읽어 세 환경 모두 같은 진실(엔진의 실제
 * 지원 여부)을 답한다. **주의**: 설치 코드는 네이티브가 없어도 키를 항상
 * 만든다(값만 `undefined`)이므로 "키 존재 여부"(덮였는가)와 "백업값의
 * truthiness"(엔진이 지원하는가)를 반드시 분리해서 봐야 한다 — 값의
 * truthiness만 보면 "안 덮임"과 "엔진 미지원"을 구분하지 못한다. `Symbol.for`
 * 키 문자열은 polyfill의 내부 구현 세부라 상류가 바뀌면 이 세 프로브가 조용히
 * "안 덮임" 분기로 빠져 다시 오염된 값을 답할 수 있다 — 그 조용한 회귀를 캡처
 * diff에서 드러내기 위해 세 프로브 모두 성공 값에 `polyfillShimmed`(감지된
 * shim 덮임 여부)를 함께 기록한다.
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */
import { captureAsync, type Outcome } from './aitCapture';

/** 캡처 레코드의 category 축 — 세 러너가 같은 값을 써야 파일명이 정렬된다. */
export const ENGINE_CATEGORY = 'engine';

/** 캡처 레코드의 scenario 축 — 프로브 전부가 같은 시나리오다. */
export const ENGINE_SCENARIO = 'capability-probe';

/**
 * 프로브 한 건의 판정 결과.
 *
 * capability 유무를 **boolean 값**이 아니라 ok/errorName 이분으로 인코딩하는
 * 이유: diff가 대조하는 필드는 `outcome`/`errorName`/`errorCode`/`returnType`/
 * `valueKeys`뿐이고 값(value) 자체는 레코드에 저장되지 않는다. "capability 없음"을
 * 값으로 표현하면 diff에 영영 안 잡힌다.
 */
export type EngineProbeVerdict =
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; errorName: string };

/** 프로브 정의 — `api`는 캡처 레코드의 api 축, `run`은 self-contained 판정 함수. */
export interface EngineProbe {
  api: string;
  /**
   * 페이지 컨텍스트에서 그대로 직렬화·실행될 수 있어야 한다.
   * 모듈 스코프 식별자 참조 금지 (파일 상단 "self-contained 제약" 참조).
   */
  run: () => EngineProbeVerdict;
}

/**
 * 프로브 9종. 순서는 캡처 파일의 레코드 순서가 되므로 기존 baseline과의
 * 대조를 위해 임의로 바꾸지 않는다.
 */
export const ENGINE_PROBES: readonly EngineProbe[] = [
  {
    // 1. 실 CSS safe-area 지원 — `CSS.supports('top: env(safe-area-inset-top)')`.
    api: 'engine.safeAreaEnv',
    run: () => {
      if (typeof CSS === 'undefined' || typeof CSS.supports !== 'function') {
        return { ok: false, errorName: 'EnvSafeAreaUnsupported' };
      }
      const supported = CSS.supports('top: env(safe-area-inset-top)');
      if (!supported) {
        return { ok: false, errorName: 'EnvSafeAreaUnsupported' };
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
      return { ok: true, value: { supported, computedTop } };
    },
  },
  {
    // 2. `window.visualViewport` 존재.
    api: 'engine.visualViewport',
    run: () => {
      const vv = window.visualViewport;
      if (!vv) {
        return { ok: false, errorName: 'VisualViewportUnsupported' };
      }
      return { ok: true, value: { width: vv.width, height: vv.height, scale: vv.scale } };
    },
  },
  {
    // 3. `devicePixelRatio` — 항상 resolve하는 계약(값 자체가 없는 엔진은 없다고 본다).
    api: 'engine.devicePixelRatio',
    run: () => {
      const dpr = window.devicePixelRatio;
      return { ok: true, value: { dpr, isInteger: Number.isInteger(dpr) } };
    },
  },
  {
    // 4. `navigator.share` 존재 — 존재 확인만, 절대 호출하지 않는다.
    //    polyfill이 활성(env3)이면 `navigator.share`는 shim이므로, 패치 전에
    //    백업해 둔 네이티브 원본(`{ share, canShare }`)에서 진실을 읽는다
    //    (파일 상단 "polyfill 투명성" 참조). 키 존재 ≠ 지원 — 백업 객체는
    //    네이티브가 없어도 항상 만들어지므로 `share` 필드의 함수 여부로 판정한다.
    api: 'engine.share',
    run: () => {
      const nav = navigator as Navigator & Record<symbol, unknown>;
      const backupKey = Symbol.for('@ait-co/polyfill/share.original');
      let shareFn: unknown;
      let polyfillShimmed: boolean;
      if (backupKey in nav) {
        polyfillShimmed = true;
        const backup = nav[backupKey] as { share?: unknown } | undefined;
        shareFn = backup?.share;
      } else {
        polyfillShimmed = false;
        shareFn = navigator.share;
      }
      if (typeof shareFn !== 'function') {
        return { ok: false, errorName: 'WebShareUnsupported' };
      }
      return { ok: true, value: { available: true, polyfillShimmed } };
    },
  },
  {
    // 5. `navigator.vibrate` 존재 — 존재 확인만, 절대 호출하지 않는다.
    //    polyfill이 활성(env3)이면 `navigator.vibrate`는 shim이므로, 패치 전에
    //    백업해 둔 bound 네이티브 함수(또는 `undefined`)에서 진실을 읽는다
    //    (파일 상단 "polyfill 투명성" 참조). 키 존재 ≠ 지원.
    api: 'engine.vibrate',
    run: () => {
      const nav = navigator as Navigator & Record<symbol, unknown>;
      const backupKey = Symbol.for('@ait-co/polyfill/vibrate.original');
      let vibrateFn: unknown;
      let polyfillShimmed: boolean;
      if (backupKey in nav) {
        polyfillShimmed = true;
        vibrateFn = nav[backupKey];
      } else {
        polyfillShimmed = false;
        vibrateFn = navigator.vibrate;
      }
      if (typeof vibrateFn !== 'function') {
        return { ok: false, errorName: 'VibrationUnsupported' };
      }
      return { ok: true, value: { available: true, polyfillShimmed } };
    },
  },
  {
    // 6. `matchMedia('(pointer: coarse)')` / `(pointer: fine)`.
    api: 'engine.pointerCoarse',
    run: () => {
      if (typeof window.matchMedia !== 'function') {
        return { ok: false, errorName: 'MatchMediaUnsupported' };
      }
      const coarse = window.matchMedia('(pointer: coarse)').matches;
      const fine = window.matchMedia('(pointer: fine)').matches;
      return { ok: true, value: { coarse, fine } };
    },
  },
  {
    // 7. `'ontouchstart' in window` 또는 `navigator.maxTouchPoints > 0`.
    api: 'engine.touchEvents',
    run: () => {
      const ontouchstart = 'ontouchstart' in window;
      const nav = navigator as Navigator & { maxTouchPoints?: number };
      const maxTouchPoints = typeof nav.maxTouchPoints === 'number' ? nav.maxTouchPoints : 0;
      if (!ontouchstart && !(maxTouchPoints > 0)) {
        return { ok: false, errorName: 'TouchUnsupported' };
      }
      return { ok: true, value: { ontouchstart, maxTouchPoints } };
    },
  },
  {
    // 8. `navigator.clipboard` 존재 + `readText`/`writeText` 메서드 유무 — 실제 호출 금지.
    //    polyfill이 활성(env3)이면 `navigator.clipboard`는 shim 객체로 통째로
    //    교체되므로, 패치 전에 백업해 둔 원본 `Clipboard` 객체(또는 `undefined`)
    //    에서 진실을 읽는다 (파일 상단 "polyfill 투명성" 참조). 키 존재 ≠ 지원.
    api: 'engine.clipboardApi',
    run: () => {
      const nav = navigator as Navigator & Record<symbol, unknown>;
      const backupKey = Symbol.for('@ait-co/polyfill/clipboard.original');
      let clipboard: unknown;
      let polyfillShimmed: boolean;
      if (backupKey in nav) {
        polyfillShimmed = true;
        clipboard = nav[backupKey];
      } else {
        polyfillShimmed = false;
        clipboard = navigator.clipboard;
      }
      if (!clipboard) {
        return { ok: false, errorName: 'ClipboardApiUnsupported' };
      }
      const c = clipboard as { readText?: unknown; writeText?: unknown };
      return {
        ok: true,
        value: {
          hasRead: typeof c.readText === 'function',
          hasWrite: typeof c.writeText === 'function',
          polyfillShimmed,
        },
      };
    },
  },
  {
    // 9. `screen.orientation?.type`.
    api: 'engine.orientationType',
    run: () => {
      const orientation = screen.orientation as ScreenOrientation | undefined;
      const type = orientation === undefined ? undefined : orientation.type;
      if (type === undefined) {
        return { ok: false, errorName: 'ScreenOrientationUnsupported' };
      }
      return { ok: true, value: { type } };
    },
  },
];

/**
 * capability 부재를 diff 가능한 named error로 인코딩한다.
 *
 * `aitCapture.ts`의 `extractErrorShape`는 `errorName`을 `err.name`이 아니라
 * `err.constructor.name`에서 뽑는다. 평범한 `new Error()`에 `e.name = name`만
 * 대입하면 인스턴스 프로퍼티만 바뀌고 `constructor.name`은 여전히 `'Error'`로
 * 고정돼 9개 프로브의 errorName이 전부 `'Error'`로 뭉개진다 — diff 판별력이
 * 사라지는 치명적 함정이다. 그래서 이름별로 익명 `Error` 서브클래스를 만들고
 * `Function.name`을 `Object.defineProperty`로 덮어써 `constructor.name`이
 * 실제로 갈라지게 한다.
 *
 * **이 함수는 러너 쪽에서만 돈다** — 페이지 안에서 던지면 구조화 복제를 건너며
 * 이 성질이 소실되기 때문이다(파일 상단 "왜 verdict 객체를 반환하나" 참조).
 */
export function namedError(name: string): Error {
  class EngineCapabilityError extends Error {}
  Object.defineProperty(EngineCapabilityError, 'name', { value: name, configurable: true });
  const e = new EngineCapabilityError(`engine capability missing: ${name}`);
  e.name = name;
  return e;
}

/** verdict를 `captureAsync`가 기대하는 resolve/reject 이분으로 되살린다. */
export async function settleProbeVerdict(
  verdict: EngineProbeVerdict,
): Promise<Record<string, unknown>> {
  if (!verdict.ok) {
    throw namedError(verdict.errorName);
  }
  return verdict.value;
}

/**
 * verdict 한 건을 캡처 레코드로 낙착시킨다. 세 러너가 전부 이 함수를 거치므로
 * category/scenario/input 축과 error/value shape 변환이 러너별로 갈라질 수 없다.
 */
export function captureProbeVerdict(
  probe: EngineProbe,
  verdict: EngineProbeVerdict,
): Promise<{ outcome: Outcome; value?: unknown; error?: unknown }> {
  return captureAsync(
    {
      category: ENGINE_CATEGORY,
      api: probe.api,
      scenario: ENGINE_SCENARIO,
      input: null,
    },
    () => settleProbeVerdict(verdict),
  );
}
