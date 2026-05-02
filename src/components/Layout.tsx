import type { CSSProperties } from 'react';
import { Outlet } from 'react-router-dom';
import { useSafeAreaInsets } from '../hooks/useSafeAreaInsets';
import { BrandMark } from './BrandMark';
import { DemoBanner } from './DemoBanner';

function insetValue(sdk: number, edge: 'top' | 'bottom' | 'left' | 'right'): string {
  return sdk > 0 ? `${sdk}px` : `env(safe-area-inset-${edge})`;
}

export function Layout() {
  const insets = useSafeAreaInsets();

  const top = insetValue(insets.top, 'top');
  const bottom = insetValue(insets.bottom, 'bottom');
  const left = insetValue(insets.left, 'left');
  const right = insetValue(insets.right, 'right');

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
