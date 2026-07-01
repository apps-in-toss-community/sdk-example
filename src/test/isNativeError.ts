/**
 * 순수 유틸리티 — Node·브라우저 양쪽에서 import 가능하도록 외부 의존이 전혀 없다.
 * `aitCapture.ts`와 `LocationPage.tsx` 양쪽이 이 모듈에서 함수를 가져간다.
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */

/**
 * 실기기 SDK 브리지가 내는 네이티브 에러 코드 집합.
 * mock은 이 코드들을 생성하지 못하므로, 이 집합에 속하는 errorCode는
 * 실 SDK 브리지를 거쳤다는 신호다.
 */
const NATIVE_ERROR_CODES = new Set([
  'NO_PERMISSION',
  'APP_LOGIN',
  'EXECUTION_ERROR',
  'NOT_SUPPORTED',
  'TIMEOUT',
  'USER_CANCELLED',
  'INVALID_PARAMS',
]);

/**
 * Returns true when `err` looks like an OS-level location failure.
 *
 * SDK surfaces iOS CoreLocation errors as untyped native strings containing
 * "LocationError" or "오류" (e.g. "MiniApp.LocationError 오류 1"), which is
 * distinct from the typed `GetCurrentLocationPermissionError` thrown when the
 * mini-app-level grant is "denied". Exported for unit testing.
 */
export function isLocationNativeError(err: unknown): boolean {
  return (
    err instanceof Error && (err.message.includes('LocationError') || err.message.includes('오류'))
  );
}

/**
 * Returns true when `err` is a native-bridge error — either a location-level
 * native string or any error carrying a known native errorCode that mock cannot
 * produce. Use this for the `isNativeShape` field in capture records.
 *
 * 판정 우선순위:
 *  1. NATIVE_ERROR_CODES 집합에 속하는 errorCode (bridge 오류)
 *  2. isLocationNativeError — iOS CoreLocation raw native string
 */
export function isNativeErrorShape(err: unknown): boolean {
  if (isLocationNativeError(err)) {
    return true;
  }
  if (err instanceof Error) {
    const withCode = err as Error & { code?: unknown; errorCode?: unknown };
    const rawCode = withCode.code ?? withCode.errorCode;
    if (typeof rawCode === 'string' && NATIVE_ERROR_CODES.has(rawCode)) {
      return true;
    }
    return false;
  }
  if (err !== null && typeof err === 'object') {
    const obj = err as Record<string, unknown>;
    const rawCode = obj.code ?? obj.errorCode;
    if (typeof rawCode === 'string' && NATIVE_ERROR_CODES.has(rawCode)) {
      return true;
    }
  }
  return false;
}
