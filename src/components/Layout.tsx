import type { CSSProperties } from 'react';
import { Outlet } from 'react-router-dom';
import { useHashScroll } from '../hooks/useHashScroll';
import { BrandMark } from './BrandMark';
import { DemoBanner } from './DemoBanner';

export function Layout() {
  useHashScroll();

  const style = {
    paddingTop: 'env(safe-area-inset-top)',
    paddingBottom: 'env(safe-area-inset-bottom)',
    paddingLeft: 'env(safe-area-inset-left)',
    paddingRight: 'env(safe-area-inset-right)',
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
