import type { CSSProperties } from 'react';
import { Outlet } from 'react-router-dom';
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

  const top = resolveInset(insets.top, 'top', isTossEnv);
  const bottom = resolveInset(insets.bottom, 'bottom', isTossEnv);
  const left = resolveInset(insets.left, 'left', isTossEnv);
  const right = resolveInset(insets.right, 'right', isTossEnv);

  // --safe-top is read by sticky descendants (PageHeader, HomePage search
  // header) — plain `sticky top-0` would anchor to the viewport and let
  // content slide under the notch on scroll.
  // --ait-safe-* mirror the :root vars written by useSafeAreaInsets for any
  // descendant that targets the shell container rather than :root directly.
  const style = {
    paddingTop: top,
    paddingBottom: bottom,
    paddingLeft: left,
    paddingRight: right,
    '--safe-top': top,
    '--ait-safe-top': top,
    '--ait-safe-bottom': bottom,
    '--ait-safe-left': left,
    '--ait-safe-right': right,
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
