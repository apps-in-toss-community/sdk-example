import type { CSSProperties } from 'react';
import { Outlet } from 'react-router-dom';
import { useSafeAreaInsets } from '../hooks/useSafeAreaInsets';
import { BrandMark } from './BrandMark';
import { DemoBanner } from './DemoBanner';

// In the Toss app trust SDK insets only — the WebView's env(safe-area-inset-*)
// double-counts. Outside Toss SDK returns zero, so env() fills in for notched
// browsers.
function resolveInset(
  sdk: number,
  edge: 'top' | 'bottom' | 'left' | 'right',
  isTossEnv: boolean,
): string {
  if (isTossEnv) return `${sdk}px`;
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
  const style = {
    paddingTop: top,
    paddingBottom: bottom,
    paddingLeft: left,
    paddingRight: right,
    '--safe-top': top,
  } as CSSProperties;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <div
        className="mx-auto max-w-[430px] min-h-screen bg-white shadow-sm dark:bg-gray-900 dark:shadow-none"
        style={style}
      >
        <BrandMark />
        <DemoBanner />
        <Outlet />
      </div>
    </div>
  );
}
