import { getOperationalEnvironment, setIosSwipeGestureEnabled } from '@apps-in-toss/web-framework';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** react-router v7 BrowserRouter가 stamp하는 history.state.idx를 안전하게 읽는다. */
export function readRouterIdx(state: unknown): number | null {
  if (state === null || typeof state !== 'object') return null;
  const idx = (state as Record<string, unknown>).idx;
  return typeof idx === 'number' ? idx : null;
}

/**
 * 깊이 → iOS edge-swipe 네이티브 제스처 on/off 결정.
 * granite 프레임워크 CanGoBackGuard 정본(prod.ios.rn84.js)을 plain react-router로
 * 이식: `!isInitialScreen || !canGoBack` → disabled. SPA(react-router pushState)는
 * WKWebView nav entry가 1개뿐 → granite의 canGoBack(네이티브 스택 깊이)을
 * history.state.idx로 대체한다.
 *   idx 0    → true  (root: 제스처 켬. swipe = 셸 밖 pop = 미니앱 정상 종료.)
 *   idx >= 1 → false (deep: 제스처 끔. 켜두면 1-entry WKWebView에서 swipe가 셸 밖
 *                     pop = 미니앱 종료(#136 회귀). in-app 뒤로는 PageHeader 버튼.)
 *   idx null → true  (판독 불가 → root로 안전 취급. dog-food 진입 화면 HomePage(root)엔
 *                     PageHeader back 버튼이 없어 여기서 disabled면 탈출 경로 소실(갇힘).
 *                     worst case가 "deep 잘못 종료"가 아니라 "root 정상 종료 허용"이라 안전.)
 */
export function decideGestureEnabled(idx: number | null): boolean {
  if (idx === null) return true;
  return idx === 0;
}

function isTossWebView(): boolean {
  try {
    return getOperationalEnvironment() === 'toss';
  } catch {
    // __CONSTANT_HANDLER_MAP 미초기화 시 RN 브리지 마커로 fallback.
    // throw가 effect를 early-return 시키지 않게 흡수 (#84 원인 차단).
    return typeof window !== 'undefined' && 'ReactNativeWebView' in window;
  }
}

function isNoSwipeGuard(): boolean {
  return (
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('noSwipeGuard') === '1'
  );
}

/**
 * iOS edge-swipe-back 가드. granite CanGoBackGuard 패턴을 plain react-router로 이식.
 * backEvent를 가로채지 않는다(edge-swipe는 backEvent 경로를 안 거침). 대신 매
 * navigation마다 네이티브 제스처를 깊이별로 재확정: deep screen에서 끄고(종료 방지)
 * root에서 켠다(정상 종료). in-app 뒤로가기는 PageHeader의 navigate(-1) 버튼이 담당.
 */
export function useIosSwipeBackGuard(): void {
  const location = useLocation();

  useEffect(() => {
    // location.key를 읽어 Biome exhaustive-deps 계약을 충족한다.
    // 실제 값은 사용하지 않는다 — deps에 두어 매 navigation마다 effect를 재실행하는 것이 목적.
    void location.key;

    if (!isTossWebView()) return;
    if (isNoSwipeGuard()) return;

    const enabled = decideGestureEnabled(readRouterIdx(window.history.state));
    setIosSwipeGestureEnabled({ isEnabled: enabled }).catch(() => {});

    // cleanup 없음 — 의도적. granite 정본은 cleanup에서 {isEnabled:true}로 복원하지만
    // 그건 다음 effect가 곧 올바른 값을 set한다는 전제다. deep→deep 이동 시
    // cleanup(true)→effect(false) 사이 native flip 지연 동안 deep에서 순간 enabled가
    // 노출돼 swipe 종료 가능. cleanup을 제거하면 deep→deep는 둘 다 false라 토글 자체가
    // 없다. SwipeBackGuard 언마운트(전체 teardown)는 미니앱이 사라지는 시점이라 무해.
  }, [location.key]);
}
