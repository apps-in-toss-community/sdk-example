import type { CSSProperties } from 'react';
import { Outlet } from 'react-router-dom';
import { useHashScroll } from '../hooks/useHashScroll';
import { useSafeAreaInsets } from '../hooks/useSafeAreaInsets';
import { BrandMark } from './BrandMark';
import { DemoBanner } from './DemoBanner';

// In the Toss app trust SDK insets only — the WebView's env(safe-area-inset-*)
// double-counts. Outside Toss SDK returns zero, so env() fills in for notched
// browsers.
//
// partner WebView 에선 토스 native chrome 이 viewport 밖에 그려져 SDK 의
// top inset 을 padding 으로 적용하면 중복 공간이 생긴다. game/external 은
// chrome 이 WebView 안 overlay 라 그대로 적용해야 한다. webViewType 분기로
// partner 의 top 만 0 으로 떨어뜨린다.
function resolveInset(
  sdk: number,
  edge: 'top' | 'bottom' | 'left' | 'right',
  isTossEnv: boolean,
): string {
  if (isTossEnv) {
    if (edge === 'top' && __WEB_VIEW_TYPE__ === 'partner') return '0px';
    return `${sdk}px`;
  }
  return sdk > 0 ? `${sdk}px` : `env(safe-area-inset-${edge})`;
}

export function Layout() {
  const { insets, isTossEnv } = useSafeAreaInsets();
  useHashScroll();

  const top = resolveInset(insets.top, 'top', isTossEnv);
  const bottom = resolveInset(insets.bottom, 'bottom', isTossEnv);
  const left = resolveInset(insets.left, 'left', isTossEnv);
  const right = resolveInset(insets.right, 'right', isTossEnv);

  // --ait-safe-* are written onto :root by useSafeAreaInsets — Layout must NOT
  // re-define them here or it would shadow the bridge-corrected root values
  // (the cross-origin iframe phantom-inset bug, #170).
  //
  // Padding consumes the :root variables directly so that environment 2 (devtools
  // launcher PWA) receives the bridge-corrected 0 px values instead of the
  // phantom env(safe-area-inset-*) the WebKit cross-origin iframe exposes.
  // resolveInset() still produces a concrete px string for the Toss WebView
  // path (isTossEnv=true) and a positive-guard for regular browsers — the var()
  // wrapper with env() fallback covers the remaining non-Toss browser path.
  //
  // --safe-top is re-exported here (consuming the :root var, not raw env()) so
  // sticky descendants (PageHeader, HomePage search header) get the same
  // corrected value without reaching up to :root themselves.
  const style = {
    paddingTop: `var(--ait-safe-top, ${top})`,
    paddingBottom: `var(--ait-safe-bottom, ${bottom})`,
    paddingLeft: `var(--ait-safe-left, ${left})`,
    paddingRight: `var(--ait-safe-right, ${right})`,
    '--safe-top': `var(--ait-safe-top, ${top})`,
  } as CSSProperties;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <div
        className="mx-auto max-w-5xl min-h-screen bg-white shadow-sm dark:bg-gray-900 dark:shadow-none"
        style={style}
      >
        <BrandMark />
        <DemoBanner />
        <Outlet />
      </div>
    </div>
  );
}
