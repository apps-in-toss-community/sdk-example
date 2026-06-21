import {
  closeView,
  getOperationalEnvironment,
  graniteEvent,
  setIosSwipeGestureEnabled,
} from '@apps-in-toss/web-framework';
import { useEffect } from 'react';
import type { NavigateFunction } from 'react-router-dom';

// iOS swipe-back guard — graniteEvent.backEvent intercept.
//
// Root cause (확정, 번들 prod.ios.rn84.js handleWebBack 디스어셈블):
//   토스 WebView 셸은 네이티브 edge-swipe(또는 back)를 받으면:
//     - backEvent 구독자 ≥1 → 구독자 콜백만 호출하고 history.back()·closeView() 둘 다
//       호출하지 않는다 (종료 통제권이 JS로 넘어온다).
//     - 구독자 0 → WebView 자체 nav history가 있으면 history.back() inject, 없으면
//       closeView()로 종료.
//   sdk-example은 plain SPA(react-router pushState만)라 WebView nav entry가 1개뿐 →
//   구독이 없으면 셸이 어느 화면에서든 canGoBack===false로 판단해 곧장 closeView() →
//   깊은 화면에서 swipe해도 in-app 뒤로가기가 아니라 미니앱 통째 종료(#100 회귀).
//   (이 경로는 popstate를 발생시키지 않으므로 이전 popstate-guard 접근은 호출조차 안 됐다.)
//
// Fix: backEvent를 한 번 구독해 종료 통제권을 JS로 가져온 뒤, react-router 깊이를 보고
//   분기한다 — idx>=1이면 navigate(-1)로 in-app pop, root(idx 0/판독불가)면 closeView()로
//   명시 종료(구독 없는 기본 미니앱과 동일한 토스 기본 동작).

/**
 * root에서 swipe-back을 어떻게 처리할지 정책. 'close' = 토스 기본 동작(미니앱 종료)과
 * 일치 — 토스 미니앱은 브라우저 chrome이 없어 swipe가 주 탈출 경로이므로 root 종료를
 * 막으면 사용자가 갇힌다. 'stay' = root swipe 무시(미종료) — 별도 종료 수단이 있는
 * 앱에서만 권장.
 */
const ROOT_POLICY: 'close' | 'stay' = 'close';

/** react-router v7 BrowserRouter가 stamp하는 history.state.idx를 안전하게 읽는다. */
export function readRouterIdx(state: unknown): number | null {
  if (state === null || typeof state !== 'object') return null;
  const idx = (state as Record<string, unknown>).idx;
  return typeof idx === 'number' ? idx : null;
}

/**
 * backEvent onEvent가 깊이별로 무엇을 해야 하는지 결정하는 순수 함수.
 * idx >= 1 → 'pop' (in-app 뒤로가기), idx 0/null → 정책에 따라 'close' | 'noop'.
 * idx 판독 불가(null)는 root로 안전 취급한다 — 'close' 정책에선 종료, 'stay'에선 미종료.
 * DOM 없이 단위 테스트한다.
 */
export function decideBackAction(
  idx: number | null,
  policy: 'close' | 'stay',
): 'pop' | 'close' | 'noop' {
  if (idx !== null && idx >= 1) return 'pop';
  return policy === 'close' ? 'close' : 'noop';
}

/**
 * 토스 WebView에서만 가드를 켠다. env-1 로컬 브라우저(devtools panel이 toss로 토글된
 * 경우 포함)에서도 동일 동작 — panel back 버튼이 깊이별 navigate/close를 그대로 구동한다.
 */
function isTossWebView(): boolean {
  try {
    return getOperationalEnvironment() === 'toss';
  } catch {
    // __CONSTANT_HANDLER_MAP 미초기화 — 토스 WebView가 항상 주입하는 RN 브리지 마커로 fallback.
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
 * iOS edge-swipe-back을 graniteEvent.backEvent 구독으로 가로채 in-app 뒤로가기로
 * 라우팅한다. 종료(root)는 closeView()로 명시 수행한다.
 *
 * `navigate`는 호출 측(Router context 내부 컴포넌트)에서 주입한다 — 가드 본체는
 * Router context 밖에서도 import 가능하게 hook으로 분리하되, useNavigate 호출은
 * SwipeBackGuard 컴포넌트가 담당한다.
 */
export function useIosSwipeBackGuard(navigate: NavigateFunction): void {
  useEffect(() => {
    if (!isTossWebView()) return;
    if (isNoSwipeGuard()) return;

    // 네이티브 제스처를 켠다(이전 빌드가 끈 적 있으면 복원). 항상 true 고정 —
    // 깊이별 토글은 하지 않는다(종료는 onEvent의 closeView로만 통제).
    setIosSwipeGestureEnabled({ isEnabled: true }).catch(() => {});

    const unsubscribe = graniteEvent.addEventListener('backEvent', {
      onEvent: () => {
        const action = decideBackAction(readRouterIdx(window.history.state), ROOT_POLICY);
        if (action === 'pop') {
          navigate(-1);
        } else if (action === 'close') {
          closeView().catch(() => {});
        }
        // 'noop' → 아무것도 안 함(미종료).
      },
      onError: () => {},
    });

    return () => {
      unsubscribe();
    };
  }, [navigate]);
}
