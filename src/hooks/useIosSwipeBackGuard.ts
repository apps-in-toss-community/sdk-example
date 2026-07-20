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
 * 이식: `!isInitialScreen || !canGoBack` → disabled. react-router pushState는
 * WKWebView 통합 세션 히스토리를 키우므로(엔트리가 1개뿐인 건 아님) — granite의
 * canGoBack(네이티브 스택 깊이)을 history.state.idx로 대체한다.
 *
 * deep(idx≥1)에서 제스처를 끄는 이유: 배포 .ait 번들(ait build → dist/web/)에는
 * 실-document 엔트리가 cold-load 문서 단 1개뿐이다 — 라우트별 실 HTML
 * (scripts/build-route-html.ts)은 GitHub Pages SSG 전용이고 .ait 번들엔 없다(ait
 * build는 그 스크립트를 돌리지 않음). 그 아래로는 전부 pushState 엔트리다. 따라서
 * 깊은 화면에서 edge-swipe가 pushState 스택 안을 pop하는 동안은 same-document
 * popstate라 react-router가 처리하고 reload가 없다. 위험은 단 하나 — 커서가 floor
 * (idx 0, cold-load 문서)에 있을 때 한 번 더 backward swipe하면 WKWebView 셸 밖으로
 * pop돼 미니앱이 종료된다(#136). 제스처를 deep에서 끄면 swipe가 floor까지 걸어
 * 내려가지 못해 그 종료를 원천 차단한다.
 *
 *   idx 0    → true  (root: 제스처 켬. swipe = 셸 밖 pop = 미니앱 정상 종료.)
 *   idx >= 1 → false (deep: 제스처 끔. floor pop = 셸 밖 종료를 차단(#136).
 *                     in-app 뒤로는 PageHeader 버튼.)
 *   idx null → true  (판독 불가 → root로 안전 취급. dog-food 진입 화면 HomePage(root)엔
 *                     PageHeader back 버튼이 없어 여기서 disabled면 탈출 경로 소실(갇힘).
 *                     worst case가 "deep 잘못 종료"가 아니라 "root 정상 종료 허용"이라 안전.)
 */
export function decideGestureEnabled(idx: number | null): boolean {
  if (idx === null) return true;
  return idx === 0;
}

export async function isTossWebView(): Promise<boolean> {
  try {
    // 상류 SDK 타입은 동기(string)지만 실기기 런타임은 Promise를 반환한다(devtools#795/#796,
    // env3 실측). await는 동기 반환·Promise 반환 양쪽에서 동작하는 version-agnostic 경로다.
    // await 없이 비교하면 Promise === 'toss'가 항상 false라 가드가 무력화된다(#136 회귀).
    return (await getOperationalEnvironment()) === 'toss';
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
 * backEvent를 별도로 가로채지 않는다 — pushState 스택 내부 pop은 react-router가
 * popstate로 이미 처리하고, floor를 넘어 셸 밖으로 나가는 pop은 popstate가
 * non-cancelable인 데다 cross-document 종료라 JS로 가로챌 수 없기 때문이다(SDK에도
 * iOS swipe를 JS 콜백으로 주는 경로가 없음 — disasm 확인). 대신 매 navigation마다
 * 네이티브 제스처를 깊이별로 재확정: deep screen에서 끄고(floor pop = 셸 밖 종료 차단)
 * root에서 켠다(정상 종료). in-app 뒤로가기는 PageHeader의 navigate(-1) 버튼이 담당.
 */
export function useIosSwipeBackGuard(): void {
  const location = useLocation();

  useEffect(() => {
    // location.key를 읽어 Biome exhaustive-deps 계약을 충족한다.
    // 실제 값은 사용하지 않는다 — deps에 두어 매 navigation마다 effect를 재실행하는 것이 목적.
    void location.key;

    let cancelled = false;

    void (async () => {
      if (!(await isTossWebView())) return;
      // isTossWebView()가 await를 거치는 동안 다음 navigation의 effect가 먼저 시작될 수
      // 있다 — cancelled 체크로 stale한 in-flight 결과가 최신 상태를 덮어쓰지 않게 막는다.
      if (cancelled) return;
      if (isNoSwipeGuard()) return;

      const enabled = decideGestureEnabled(readRouterIdx(window.history.state));
      setIosSwipeGestureEnabled({ isEnabled: enabled }).catch(() => {});
    })();

    // cleanup은 cancelled 플래그만 세운다 — 의도적으로 gesture를 복원하지 않는다.
    // granite 정본은 cleanup에서 {isEnabled:true}로 복원하지만 그건 다음 effect가 곧
    // 올바른 값을 set한다는 전제다. deep→deep 이동 시 cleanup(true)→effect(false) 사이
    // native flip 지연 동안 deep에서 순간 enabled가 노출돼 swipe 종료 가능. cleanup에서
    // 값을 되돌리지 않으면 deep→deep는 둘 다 false라 토글 자체가 없다. SwipeBackGuard
    // 언마운트(전체 teardown)는 미니앱이 사라지는 시점이라 무해.
    return () => {
      cancelled = true;
    };
  }, [location.key]);
}
