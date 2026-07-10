/**
 * `.ait.test` 슈트 공용 캡처 인프라 — QA 매트릭스(값 다양화 + 의도적 오류 +
 * 버전/플랫폼 오류-shape 대조)의 4-cell 레코드를 모은다.
 *
 * ─ mock 배선 결정 ────────────────────────────────────────────────────────────
 * vitest는 devtools unplugin(`@apps-in-toss/web-framework` → mock rewrite)이
 * 돌지 않는 환경이다 — 그 unplugin은 Vite dev/build 전용이다. 따라서 `.ait.test`
 * 파일이 SDK 표면을 import해 실제로 호출하려면 vitest 쪽에서 같은 swap을 다시
 * 만들어줘야 한다. 두 후보 중:
 *   (a) 테스트가 `@ait-co/devtools/mock`을 직접 import   → import 경로가 real
 *       SDK와 달라져 env3(real SDK)에서 같은 파일을 못 쓴다.
 *   (b) vitest `test.alias`로 `@apps-in-toss/web-framework` → 그 mock으로 매핑.
 * (b)를 택했다(`vitest.config.ts`). 그러면 12개 테스트 파일이 **real SDK와
 * 동일한 import 문**(`from '@apps-in-toss/web-framework'`)을 쓰고, env1에선 alias가
 * mock으로, env3에선 alias 없이 real SDK로 resolve된다 — 같은 슈트, cell 축만 다름.
 * 기존 컴포넌트 smoke 테스트는 SDK를 직접 import하지 않아 alias 영향이 없다.
 *
 * ─ 환경 적응 (env1 Node / env3 브라우저) ─────────────────────────────────────
 * env1(vitest/Node): Node builtins(fs/path)로 `.ait-capture/<cat>.<sdk>.<platform>.json` 기록.
 * env3(run_tests 브라우저 주입): 파일시스템 없음 → globalThis.__AIT_CAPTURE__ 배열 + console.log.
 * 분기는 `isNode` 런타임 가드로. Node builtins는 동적 import로만 로드(top-level 금지 —
 * esbuild iife 번들이 static import를 resolve할 수 없어 빌드 실패).
 *
 * `aitCapture.ts`는 QA 인프라이지 일반 미니앱 개발자가 복사할 런타임 코드가
 * 아니므로 `src/test/`(이미 setup.ts가 있는 곳)에 둔다 — `src/` 런타임 표면을
 * 오염시키지 않는다.
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */
import { isNativeErrorShape } from './isNativeError';

/** Node 환경 여부 — 브라우저(env3)에선 false. */
const isNode =
  typeof process !== 'undefined' && process.versions != null && process.versions.node != null;

/** 4-cell 축의 SDK 라인 (런타임 web-framework major). */
export type SdkLine = '2.x' | '3.x';
/** 4-cell 축의 플랫폼. env1 → 'mock'; env3 → 실기기. */
export type Platform = 'mock' | 'ios' | 'android';

/**
 * 호출 결과의 정규화 분류.
 *
 * `callback-timeout`은 `captureCallback` 전용 — onEvent/onError 어느 쪽도
 * 정해진 시간 내에 발화하지 않은 경우다. `rejected`(명시적 오류 응답)와
 * 의미가 다르므로 별도 태그로 둔다: 이벤트-구독형 API(광고 미노출, 알림
 * 미수신 등)에서는 "제한 시간 내 무응답"이 실기기에서 흔히 발생하는
 * 정상 상황이라, 이를 `rejected`로 오기록하면 진짜 오류와 구분이 안 돼
 * 4-cell diff가 무의미해진다.
 *
 * `timeout`은 `captureAsync`의 `raceTimeoutMs` 옵션 전용(#274) — 단일
 * Promise 호출(`getCurrentLocation` 등)이 native 브리지에서 hang되는 경우를
 * 잡는다. `callback-timeout`(이벤트 구독형, "무응답이 정상"인 API)과는
 * 발생 맥락이 달라 별도 태그로 둔다 — 4-cell diff에서 "구독 API가 정상
 * 무응답" vs "단발 호출이 native에서 멈춤"을 구분할 수 있어야 한다.
 */
export type Outcome =
  | 'resolved'
  | 'rejected'
  | 'returned-sync'
  | 'threw-sync'
  | 'callback-timeout'
  | 'timeout';

/**
 * 4-cell 대조용 정규화 레코드. 필드명은 12개 파일 전체에서 고정 —
 * 하네스가 `<cat>.<sdkLine>.<platform>.json` 4개를 diff해 2×2 매트릭스를 채운다.
 */
export interface AitCaptureRecord {
  category: string;
  api: string;
  scenario: string;
  /** 실제로 전달한 다양화/잘못된 인자. */
  input: unknown;
  outcome: Outcome;
  // --- error shape (성공 시 null) ---
  /** err.constructor.name e.g. 'TypeError', 'GetCurrentLocationPermissionError'. */
  errorName: string | null;
  /** err.code / err.errorCode if present (bridge 오류는 numeric code를 가짐). */
  errorCode: string | number | null;
  /** raw err.message — iOS CoreLocation native string vs Android shape가 여기서 발산. */
  errorMessage: string | null;
  /** Object.keys(err) — name이 같아도 shape diff를 surface. */
  errorKeys: string[];
  /** isNativeErrorShape — location native string 또는 알려진 native errorCode 매치. */
  isNativeShape: boolean;
  // --- value shape (오류 시 null) ---
  /** typeof result, 또는 thenable이 새면 'Promise' (A1 잡음). */
  returnType: string;
  /** object 반환의 Object.keys(result) — { success, reason } vs { top,bottom,... }. */
  valueKeys: string[] | null;
  // --- 4-cell 축 (runner가 채움, 테스트가 아님) ---
  sdkLine: SdkLine;
  platform: Platform;
  /**
   * THROTTLED(#290) backoff 재시도 횟수 — **1회 이상 발생했을 때만** 존재한다.
   * 0이면 필드 자체를 생략해 기존 레코드 shape(및 diff 스크립트 호환)를 무변경으로 둔다.
   */
  throttleRetries?: number;
}

/** 테스트가 채우는 부분 — cell 축(sdkLine/platform)은 runner가 주입한다. */
export type CaptureInput = Omit<AitCaptureRecord, 'sdkLine' | 'platform'>;

/**
 * env3 runner가 device platform/version을 주입하는 hook. 있으면 우선한다.
 * 예: `globalThis.__AIT_CELL__ = { sdkLine: '3.x', platform: 'ios' }`.
 */
interface AitCellOverride {
  sdkLine?: SdkLine;
  platform?: Platform;
}

/**
 * env3 브라우저 캡처 결과를 담는 global 배열. esbuild iife 번들에서 접근.
 * `__AIT_CAPTURE__ <category> <json>` 형식의 console.log도 함께 출력한다.
 */
interface AitCaptureGlobal {
  __AIT_CELL__: AitCellOverride | undefined;
  __AIT_CAPTURE__: AitCaptureRecord[] | undefined;
}

declare global {
  // global 변수 augmentation은 `var`만 허용된다(let/const 불가).
  var __AIT_CELL__: AitCellOverride | undefined;
  var __AIT_CAPTURE__: AitCaptureRecord[] | undefined;
}

/**
 * 설치된 `@apps-in-toss/web-framework`의 major로 sdkLine을 결정한다.
 * env1(vitest alias → mock)에서도 real 패키지의 version은 그대로 읽힌다.
 * env3(브라우저)에서는 globalThis.__AIT_CELL__?.sdkLine 주입값 또는 '2.x' fallback.
 */
async function resolveSdkLine(): Promise<SdkLine> {
  const override = globalThis.__AIT_CELL__?.sdkLine;
  if (override === '2.x' || override === '3.x') {
    return override;
  }
  if (isNode) {
    try {
      // 런타임 의존이 아니라 버전 probe — alias 영향 밖의 real 패키지 메타.
      // specifier를 변수로 간접화해 esbuild/browser 번들의 정적 그래프에서 제외한다
      // (#233과 동일 — 리터럴 동적 import는 esbuild가 여전히 따라가 env3 번들이 깨진다).
      const moduleMod = 'node:module';
      const { createRequire } = await import(/* @vite-ignore */ moduleMod);
      const nodeRequire = createRequire(import.meta.url);
      const pkg = nodeRequire('@apps-in-toss/web-framework/package.json') as {
        version?: string;
      };
      const major = pkg.version?.split('.')[0];
      return major === '3' ? '3.x' : '2.x';
    } catch {
      return '2.x';
    }
  }
  // 브라우저(env3): __AIT_CELL__ 미주입이면 기본값.
  return '2.x';
}

/**
 * 플랫폼 축. env1에서는 항상 'mock'. env3 runner가 override로 'ios'/'android' 주입.
 */
function resolvePlatform(): Platform {
  const override = globalThis.__AIT_CELL__?.platform;
  if (override === 'mock' || override === 'ios' || override === 'android') {
    return override;
  }
  // process는 브라우저에 없다 — 가드 필수.
  if (isNode) {
    const fromEnv = process.env.AIT_CELL_PLATFORM;
    if (fromEnv === 'ios' || fromEnv === 'android') {
      return fromEnv;
    }
  }
  return 'mock';
}

// sdkLine: override가 있으면 동기로 확정, 없으면 flushCapture 첫 호출 때 probe.
function resolveSdkLineSync(): SdkLine {
  const override = globalThis.__AIT_CELL__?.sdkLine;
  if (override === '2.x' || override === '3.x') {
    return override;
  }
  // Node 동기 probe — `require`는 Node ESM에선 없으므로 createRequire 사용
  // (동적 import는 async이라 여기선 불가 → probe는 flushCapture async로 위임).
  return '2.x'; // flushCapture에서 교정될 수 있다.
}

// 모듈 로드 시 동기로 결정. Node이고 override가 없으면 '2.x' 임시값;
// flushCapture 시 비동기 probe 결과로 교정한다.
let CELL_SDK_LINE: SdkLine = resolveSdkLineSync();

/**
 * 현재 cell 축 — 테스트가 `skipIf(platform === 'mock')` 가드에 쓴다.
 *
 * fix #3: `platform`은 모듈 로드 시 frozen되지 않고 getter로 매번 재읽는다.
 * `__AIT_CELL__`이 inject 타이밍과 race하더라도 첫 `cell.platform` 접근 시점에
 * 올바른 값을 반환하므로 latent race를 봉쇄한다. 한 번 non-mock으로 확정되면
 * 캐시해 매 호출 오버헤드를 제한한다.
 */
let _resolvedPlatform: Platform | null = null;
export const cell: { sdkLine: SdkLine; readonly platform: Platform } = {
  sdkLine: CELL_SDK_LINE,
  get platform(): Platform {
    if (_resolvedPlatform !== null) {
      return _resolvedPlatform;
    }
    const p = resolvePlatform();
    // non-mock이 확정되면 이후 재읽기 불필요 — 캐시.
    if (p !== 'mock') {
      _resolvedPlatform = p;
    }
    return p;
  },
};

/** module-level sink. afterAll에서 카테고리별로 파일에 flush한다. */
const records: AitCaptureRecord[] = [];

/** 테스트가 부른다 — cell 축을 붙여 sink에 append. */
export function capture(input: CaptureInput): void {
  // fix #3: platform을 호출 시점에 재읽기 — 모듈 로드 시 frozen하지 않는다.
  records.push({ ...input, sdkLine: CELL_SDK_LINE, platform: cell.platform });
}

/** 에러 객체에서 정규화 오류-shape 필드를 뽑는다. */
function extractErrorShape(err: unknown): {
  errorName: string | null;
  errorCode: string | number | null;
  errorMessage: string | null;
  errorKeys: string[];
  isNativeShape: boolean;
} {
  if (err instanceof Error) {
    const withCode = err as Error & { code?: unknown; errorCode?: unknown };
    const rawCode = withCode.code ?? withCode.errorCode;
    const errorCode = typeof rawCode === 'string' || typeof rawCode === 'number' ? rawCode : null;
    return {
      errorName: err.constructor.name,
      errorCode,
      errorMessage: err.message,
      // own enumerable keys — name이 같아도 bridge가 붙인 extra 필드를 surface.
      errorKeys: Object.keys(err),
      // fix #6: location native string + 알려진 native errorCode 집합까지 확대.
      isNativeShape: isNativeErrorShape(err),
    };
  }
  // Error가 아닌 값으로 reject/throw되는 경우(bridge가 raw object를 던질 수 있음).
  if (err !== null && typeof err === 'object') {
    const obj = err as Record<string, unknown>;
    const rawCode = obj.code ?? obj.errorCode;
    const errorCode = typeof rawCode === 'string' || typeof rawCode === 'number' ? rawCode : null;
    const rawMessage = obj.message;
    return {
      errorName: obj.name === undefined ? null : String(obj.name),
      errorCode,
      errorMessage: typeof rawMessage === 'string' ? rawMessage : null,
      errorKeys: Object.keys(obj),
      // fix #6: raw object도 native shape 판정 대상.
      isNativeShape: isNativeErrorShape(err),
    };
  }
  return {
    errorName: err === undefined ? null : typeof err,
    errorCode: null,
    errorMessage: err === undefined ? null : String(err),
    errorKeys: [],
    isNativeShape: false,
  };
}

/** 반환값에서 value-shape 필드(returnType/valueKeys)를 뽑는다. */
function extractValueShape(value: unknown): { returnType: string; valueKeys: string[] | null } {
  // thenable이 새어나오면(A1: await 안 한 Promise 반환) returnType='Promise'.
  if (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as { then?: unknown }).then === 'function'
  ) {
    return { returnType: 'Promise', valueKeys: null };
  }
  if (Array.isArray(value)) {
    return { returnType: 'array', valueKeys: null };
  }
  if (value !== null && typeof value === 'object') {
    return { returnType: 'object', valueKeys: Object.keys(value) };
  }
  return { returnType: value === null ? 'null' : typeof value, valueKeys: null };
}

/**
 * async 호출을 실행해 정규화 레코드 한 건을 캡처하고, 동시에 raw 결과를
 * 테스트가 단언할 수 있게 돌려준다. resolve/reject를 잡아 sink에 push.
 *
 * `raceTimeoutMs`(#274) — 지정하면 `call()`의 Promise를 JS 타이머와
 * `Promise.race`한다. native 브리지 호출이 hang되면(예: GPS cold-fix로
 * `getCurrentLocation`이 응답 없이 멈춤) JS는 그 native Promise를 취소할
 * 방법이 없다 — 그래서 이 레이스는 **버려진 원본 Promise를 의도적으로
 * dangling 상태로 남긴다**. 목적은 hang을 없애는 게 아니라, hang이 파일
 * 전체의 evaluate 예산을 다 태워 파일을 전멸시키기 전에 이 한 호출만
 * `outcome: 'timeout'` 레코드로 낙착시켜 파일이 다음 테스트로 넘어가게
 * 하는 것이다(런타임 프로세스가 종료되면 dangling promise도 함께 사라진다).
 *
 * ─ THROTTLED backoff 재시도(#290) ──────────────────────────────────────────
 * 2026-07-10 토스 앱 업데이트 이후 2.x 브리지 경로에 native rate limit이
 * 생겼다 — 같은 브리지 메서드를 짧은 윈도우 안에 반복 호출하면
 * `errorCode: 'APP_BRIDGE_THROTTLED'`로 즉시 reject된다. 이 슈트의 호출은
 * 전부 이 함수 안에서 실행되므로(러너 레벨 재시도가 못 보는 계층), THROTTLED
 * rejection만 골라 backoff 후 같은 `call()`을 재시도한다. 사다리
 * `[1000, 3000, 8000]`ms는 누적-윈도우 가설(#290 관측)을 감안해 인내심 있게
 * 설계됐다 — 임의로 줄이지 않는다. THROTTLED가 아닌 rejection은 재시도 없이
 * 즉시 기록한다(2.x↔3.0 오류-shape 대조가 이 슈트의 존재 이유라, 진짜 오류를
 * 재시도로 가리면 안 된다).
 *
 * @returns `{ outcome, value?, error? }` — 단언은 테스트가 한다(캡처는 부수효과).
 */
export async function captureAsync(
  meta: { category: string; api: string; scenario: string; input: unknown },
  call: () => Promise<unknown>,
  options?: { raceTimeoutMs?: number },
): Promise<{ outcome: Outcome; value?: unknown; error?: unknown }> {
  const raceTimeoutMs = options?.raceTimeoutMs;
  let throttleRetries = 0;
  for (;;) {
    try {
      const value =
        raceTimeoutMs === undefined ? await call() : await raceWithTimeout(call(), raceTimeoutMs);
      if (value === TIMEOUT_SENTINEL) {
        capture({
          ...meta,
          outcome: 'timeout',
          errorName: null,
          errorCode: null,
          errorMessage: null,
          errorKeys: [],
          isNativeShape: false,
          returnType: 'undefined',
          valueKeys: null,
          ...(throttleRetries > 0 ? { throttleRetries } : {}),
        });
        return { outcome: 'timeout' };
      }
      const { returnType, valueKeys } = extractValueShape(value);
      capture({
        ...meta,
        outcome: 'resolved',
        errorName: null,
        errorCode: null,
        errorMessage: null,
        errorKeys: [],
        isNativeShape: false,
        returnType,
        valueKeys,
        ...(throttleRetries > 0 ? { throttleRetries } : {}),
      });
      return { outcome: 'resolved', value };
    } catch (error) {
      if (isThrottledError(error) && throttleRetries < THROTTLE_BACKOFF_MS.length) {
        // 가드가 인덱스 유효성을 보장하지만 `noUncheckedIndexedAccess`는 이를 narrow하지
        // 못한다 — 마지막 사다리 값(8000ms)을 안전한 fallback으로 둔다(도달할 일 없음).
        const waitMs = THROTTLE_BACKOFF_MS[throttleRetries] ?? 8000;
        throttleRetries += 1;
        await delay(waitMs);
        continue;
      }
      capture({
        ...meta,
        outcome: 'rejected',
        ...extractErrorShape(error),
        returnType: 'undefined',
        valueKeys: null,
        ...(throttleRetries > 0 ? { throttleRetries } : {}),
      });
      return { outcome: 'rejected', error };
    }
  }
}

/**
 * 2.x native bridge rate-limit rejection 감지(#290). envelope은
 * `{ name, code, userInfo, moduleName, __isError }` — `code`가 문자열로
 * 오지만 message 텍스트로만 판별 가능한 변형도 있어 두 기준을 or로 둔다.
 */
function isThrottledError(err: unknown): boolean {
  if (err === null || typeof err !== 'object') {
    return false;
  }
  const withFields = err as { code?: unknown; message?: unknown };
  if (withFields.code === 'APP_BRIDGE_THROTTLED') {
    return true;
  }
  return String(withFields.message ?? '').includes('Too many app bridge calls');
}

/** THROTTLED 재시도 대기 사다리(ms) — 누적-윈도우 가설을 감안한 인내심 있는 backoff(#290). */
const THROTTLE_BACKOFF_MS = [1000, 3000, 8000] as const;

/** page-side 안전한 순수 지연 — node builtin 의존 없음. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** `raceWithTimeout` 내부에서만 쓰는 sentinel — 실제 SDK 반환값과 절대 충돌하지 않도록 고유 심볼로 둔다. */
const TIMEOUT_SENTINEL: unique symbol = Symbol('ait-capture-race-timeout');

/**
 * `promise`와 `timeoutMs` 타이머를 경합시킨다. 타이머가 먼저 끝나면
 * `TIMEOUT_SENTINEL`로 resolve한다 — 원본 `promise`는 취소되지 않고
 * 그대로 버려진다(JS에는 native Promise를 취소할 방법이 없다).
 */
function raceWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T | typeof TIMEOUT_SENTINEL> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(TIMEOUT_SENTINEL), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/** `captureCallback`이 `run`에 넘기는 핸들러. */
export interface CallbackHandlers {
  onEvent: (value: unknown) => void;
  onError: (error: unknown) => void;
}

/** `run`이 돌려주는 구독 해제 함수 — 없으면(undefined/void) 생략 가능. */
export type CallbackCleanup = (() => void) | undefined;

/**
 * 이벤트-구독형 SDK API(`(params + onEvent/onError) => cleanupFn` 형태 —
 * contactsViral, events, notification, ads load/show 등)를 캡처한다.
 *
 * `captureAsync`는 반환된 Promise 하나가 최종 결과인 API를 전제하지만,
 * 이 계열 API는 콜백으로 결과를 통지하고 구독 해제 함수를 동기 반환한다
 * (또는 아무것도 반환하지 않는다). 이 함수는 그 형태를 `captureAsync`와
 * 동일한 4-cell 레코드로 정규화한다.
 *
 * ─ `callback-timeout` — legitimate-silence vs error ────────────────────────
 * onEvent/onError 어느 쪽도 `timeoutMs`(기본 3000ms, 러너의 파일당 예산보다
 * 훨씬 짧게 잡아 hang이 파일 전체를 드롭시키지 않게 함) 내에 발화하지 않으면
 * `outcome: 'callback-timeout'`으로 기록한다. 이는 `rejected`(명시적 오류
 * 응답)와 의도적으로 구분한다 — 실기기에서 "3초 내 이벤트 없음"은 광고 미노출,
 * 푸시 미수신처럼 **정당한 무응답**인 경우가 흔해, 이를 오류로 오기록하면
 * 4-cell diff 도구가 실제 회귀와 정상 무응답을 구분할 수 없게 된다.
 *
 * ─ cleanup 보장 ─────────────────────────────────────────────────────────────
 * `run`이 반환한 cleanup은 성공/오류/타임아웃 모든 경로에서 `finally`로
 * 반드시 호출한다 — 구독이 새면 같은 파일의 이후 테스트를 오염시킬 수 있다.
 * cleanup 자체가 던지는 예외는 삼켜서(outcome을 덮어쓰지 않음) 원래 결과를
 * 가린다.
 *
 * @returns `captureAsync`와 동일한 형태 — `value`는 최초 onEvent 페이로드.
 */
export function captureCallback(
  meta: { category: string; api: string; scenario: string; input: unknown; timeoutMs?: number },
  run: (handlers: CallbackHandlers) => CallbackCleanup,
): Promise<{ outcome: Outcome; value?: unknown; error?: unknown }> {
  const timeoutMs = meta.timeoutMs ?? 3000;

  return new Promise((resolvePromise) => {
    let settled = false;
    // `run`이 onEvent/onError를 **동기로** 호출하는 경우, `finish`가 실행되는
    // 시점엔 아직 `run()`이 반환 전이라 cleanup fn을 못 받은 상태다. 그래서
    // cleanup 실행 여부를 별도 플래그로 늦추고, `run()` 반환 직후 이미
    // settle됐다면 그때 cleanup을 돌린다 — sync/async 두 경로 모두 커버.
    let cleanup: CallbackCleanup;
    // `run()`이 아직 cleanup fn을 반환하기 전인지(sync onEvent/onError 경로)
    // 구분하는 플래그 — 이게 true인 동안은 `runCleanup`을 호출해도 아직 실행할
    // 게 없으므로 "완료됨"으로 표시하지 않고, `run()` 반환 직후 다시 시도한다.
    let cleanupAssigned = false;
    let cleanupDone = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const runCleanup = () => {
      if (cleanupDone || !cleanupAssigned) {
        return;
      }
      cleanupDone = true;
      try {
        cleanup?.();
      } catch {
        // cleanup 자체의 예외는 삼킨다 — 원래 outcome을 가리지 않는다.
      }
    };

    const finish = (result: { outcome: Outcome; value?: unknown; error?: unknown }) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      // cleanup이 아직 (sync run 도중이라) 대입 전일 수 있다 — 대입돼 있으면
      // 바로 돌리고, 아니라면 run() 반환 직후 지점에서 마저 돌린다.
      runCleanup();

      if (result.outcome === 'resolved') {
        const { returnType, valueKeys } = extractValueShape(result.value);
        capture({
          category: meta.category,
          api: meta.api,
          scenario: meta.scenario,
          input: meta.input,
          outcome: 'resolved',
          errorName: null,
          errorCode: null,
          errorMessage: null,
          errorKeys: [],
          isNativeShape: false,
          returnType,
          valueKeys,
        });
      } else if (result.outcome === 'rejected') {
        capture({
          category: meta.category,
          api: meta.api,
          scenario: meta.scenario,
          input: meta.input,
          outcome: 'rejected',
          ...extractErrorShape(result.error),
          returnType: 'undefined',
          valueKeys: null,
        });
      } else {
        // callback-timeout — 명시적 응답 없음. 오류-shape 필드는 전부 null/빈값.
        capture({
          category: meta.category,
          api: meta.api,
          scenario: meta.scenario,
          input: meta.input,
          outcome: 'callback-timeout',
          errorName: null,
          errorCode: null,
          errorMessage: null,
          errorKeys: [],
          isNativeShape: false,
          returnType: 'undefined',
          valueKeys: null,
        });
      }

      resolvePromise(result);
    };

    timer = setTimeout(() => {
      finish({ outcome: 'callback-timeout' });
    }, timeoutMs);

    cleanup = run({
      onEvent: (value) => finish({ outcome: 'resolved', value }),
      onError: (error) => finish({ outcome: 'rejected', error }),
    });
    cleanupAssigned = true;
    // sync onEvent/onError 경로: `finish`가 이미 위에서 실행돼 settled=true지만
    // 그 시점엔 `cleanup`이 아직 미대입이라 runCleanup()이 no-op였다 — 지금
    // `cleanup`이 확정됐으니 여기서 마저 돌린다.
    if (settled) {
      runCleanup();
    }
  });
}

/**
 * 동기 호출 버전 — `returned-sync` / `threw-sync`로 분류한다.
 * A1(getIsTossLoginIntegratedService가 boolean인지 Promise인지) 같은 sync 표면용.
 */
export function captureSync(
  meta: { category: string; api: string; scenario: string; input: unknown },
  call: () => unknown,
): { outcome: Outcome; value?: unknown; error?: unknown } {
  try {
    const value = call();
    const { returnType, valueKeys } = extractValueShape(value);
    capture({
      ...meta,
      outcome: 'returned-sync',
      errorName: null,
      errorCode: null,
      errorMessage: null,
      errorKeys: [],
      isNativeShape: false,
      returnType,
      valueKeys,
    });
    return { outcome: 'returned-sync', value };
  } catch (error) {
    capture({
      ...meta,
      outcome: 'threw-sync',
      ...extractErrorShape(error),
      returnType: 'undefined',
      valueKeys: null,
    });
    return { outcome: 'threw-sync', error };
  }
}

/**
 * 한 카테고리 파일이 모은 레코드를 flush한다.
 *
 * env1(Node/vitest): `.ait-capture/<cat>.<sdkLine>.<platform>.json` 파일로 기록.
 * env3(브라우저/run_tests): globalThis.__AIT_CAPTURE__ 배열에 push +
 *   `__AIT_CAPTURE__ <category> <json>` 형식으로 console.log (에이전트가 relay
 *   콘솔에서 수확할 수 있도록 안정적인 prefix 사용).
 *
 * 각 `.ait.test.ts`의 `afterAll`에서 자기 카테고리 이름으로 호출한다.
 * 산출물은 gitignore(`.ait-capture/`) — `.ait` 번들처럼 per-run.
 */
export async function flushCapture(category: string): Promise<void> {
  // sdkLine을 비동기 probe로 교정 (override 없는 Node 환경에서 정확한 버전 확정).
  const resolvedSdkLine = await resolveSdkLine();
  if (resolvedSdkLine !== CELL_SDK_LINE) {
    CELL_SDK_LINE = resolvedSdkLine;
    cell.sdkLine = resolvedSdkLine;
    // 이미 쌓인 레코드의 sdkLine을 소급 교정.
    for (const r of records) {
      r.sdkLine = resolvedSdkLine;
    }
  }

  const forCategory = records.filter((r) => r.category === category);
  if (forCategory.length === 0) {
    return;
  }

  if (isNode) {
    // env1(vitest/Node) — 파일시스템에 기록.
    // specifier를 변수로 간접화해 esbuild/browser 번들의 정적 그래프에서 제외한다.
    // (리터럴 동적 import는 esbuild가 여전히 따라가 `node:fs` resolve를 시도하므로
    //  env3 run_tests 브라우저 번들이 깨진다 — 변수 specifier는 external로 남는다.)
    const fsMod = 'node:fs';
    const pathMod = 'node:path';
    const { mkdirSync, writeFileSync } = await import(/* @vite-ignore */ fsMod);
    const { resolve } = await import(/* @vite-ignore */ pathMod);
    // process는 isNode 가드 안에서만 접근.
    const captureDir = resolve(process.cwd(), '.ait-capture');
    mkdirSync(captureDir, { recursive: true });
    const file = resolve(captureDir, `${category}.${CELL_SDK_LINE}.${cell.platform}.json`);
    writeFileSync(file, `${JSON.stringify(forCategory, null, 2)}\n`, 'utf8');
  } else {
    // env3(브라우저/run_tests 주입) — global 배열 + console.log.
    // run_tests가 relay 콘솔을 수확해 4-cell 레코드를 추출한다.
    const g = globalThis as AitCaptureGlobal;
    if (!Array.isArray(g.__AIT_CAPTURE__)) {
      g.__AIT_CAPTURE__ = [];
    }
    for (const r of forCategory) {
      g.__AIT_CAPTURE__!.push(r);
    }
    // 에이전트가 console.log 스트림에서 파싱할 수 있도록 안정적인 prefix + 단일 JSON 라인.
    console.log(`__AIT_CAPTURE__ ${category} ${JSON.stringify(forCategory)}`);
  }
}
