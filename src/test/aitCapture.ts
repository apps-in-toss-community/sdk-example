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
import { isLocationNativeError } from './isNativeError';

/** Node 환경 여부 — 브라우저(env3)에선 false. */
const isNode =
  typeof process !== 'undefined' && process.versions != null && process.versions.node != null;

/** 4-cell 축의 SDK 라인 (런타임 web-framework major). */
export type SdkLine = '2.x' | '3.x';
/** 4-cell 축의 플랫폼. env1 → 'mock'; env3 → 실기기. */
export type Platform = 'mock' | 'ios' | 'android';

/** 호출 결과의 정규화 분류. */
export type Outcome = 'resolved' | 'rejected' | 'returned-sync' | 'threw-sync';

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
  /** isLocationNativeError-style native-error 휴리스틱 매치. */
  isNativeShape: boolean;
  // --- value shape (오류 시 null) ---
  /** typeof result, 또는 thenable이 새면 'Promise' (A1 잡음). */
  returnType: string;
  /** object 반환의 Object.keys(result) — { success, reason } vs { top,bottom,... }. */
  valueKeys: string[] | null;
  // --- 4-cell 축 (runner가 채움, 테스트가 아님) ---
  sdkLine: SdkLine;
  platform: Platform;
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
      // 동적 import: esbuild iife 번들이 static 'node:module' import를 resolve할 수 없다.
      const { createRequire } = await import('node:module');
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

// cell 값은 동기 resolvePlatform()로 즉시 확정. sdkLine은 비동기 probe지만
// top-level await는 vitest ESM 환경에선 지원되나 iife 번들에선 불가 →
// 초기값은 override 우선(동기)으로 결정하고, probe가 필요하면 flushCapture 시 확정.
const CELL_PLATFORM = resolvePlatform();

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

/** 현재 cell 축 — 테스트가 `skipIf(platform === 'mock')` 가드에 쓴다. */
export const cell: { sdkLine: SdkLine; platform: Platform } = {
  sdkLine: CELL_SDK_LINE,
  platform: CELL_PLATFORM,
};

/** module-level sink. afterAll에서 카테고리별로 파일에 flush한다. */
const records: AitCaptureRecord[] = [];

/** 테스트가 부른다 — cell 축을 붙여 sink에 append. */
export function capture(input: CaptureInput): void {
  records.push({ ...input, sdkLine: CELL_SDK_LINE, platform: CELL_PLATFORM });
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
      isNativeShape: isLocationNativeError(err),
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
      isNativeShape: false,
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
 * @returns `{ outcome, value?, error? }` — 단언은 테스트가 한다(캡처는 부수효과).
 */
export async function captureAsync(
  meta: { category: string; api: string; scenario: string; input: unknown },
  call: () => Promise<unknown>,
): Promise<{ outcome: Outcome; value?: unknown; error?: unknown }> {
  try {
    const value = await call();
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
    });
    return { outcome: 'resolved', value };
  } catch (error) {
    capture({
      ...meta,
      outcome: 'rejected',
      ...extractErrorShape(error),
      returnType: 'undefined',
      valueKeys: null,
    });
    return { outcome: 'rejected', error };
  }
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
    const file = resolve(captureDir, `${category}.${CELL_SDK_LINE}.${CELL_PLATFORM}.json`);
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
