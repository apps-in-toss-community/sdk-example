/**
 * 순수 유틸리티 — Node·브라우저 양쪽에서 import 가능하도록 외부 의존이 전혀 없다.
 * `aitCapture.ts`와 `LocationPage.tsx` 양쪽이 이 모듈에서 함수를 가져간다.
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */

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
