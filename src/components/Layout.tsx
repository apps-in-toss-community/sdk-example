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
    // 외부 셸 배경을 콘텐츠(bg-white)와 동일하게 통일해 노치/홈인디케이터 영역에
    // 회색 plane이 노출될 여지를 구조적으로 제거한다(env 1·2·3 시각 정합). 데스크톱
    // 좌우 거터(회색)는 index.css의 width-gated 규칙(@media min-width:64rem)이 되살린다.
    <div className="min-h-screen bg-white dark:bg-gray-900">
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
