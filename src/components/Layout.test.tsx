import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Layout } from './Layout';

// React 가 style={{...}} 를 DOM 에 적용할 때 jsdom CSSStyleDeclaration setter 가
// env() 를 미인식 값으로 거부해 렌더된 DOM 에선 paddingTop 이 ''. 따라서 inset 의
// env() 단일 출처 계약은 렌더 DOM 이 아니라 소스 텍스트로 고정한다(jsdom 한계 우회).
// vitest 에선 import.meta.url 을 new URL() 에 바로 넣으면 non-file scheme 으로 깨질
// 수 있어, dirname 으로 디렉토리를 얻어 resolve 로 형제 소스 경로를 만든다.
const LAYOUT_SOURCE = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), 'Layout.tsx'),
  'utf8',
);

// 회귀 가드 — env 1·2·3 safe-area 시각 정합(노치 회색 띠 제거)의 계약을 고정한다.
// 픽셀 회귀(노치 영역 흰색 연속, 데스크톱 거터 보존)는 jsdom 으로 잡을 수 없어
// Playwright(env 1) + relay 실측(env 2·3)이 담당하고, 여기서는 그 결과를 만드는
// 두 불변식만 단언한다: (1) 외부 셸 배경이 콘텐츠색으로 통일됐는가, (2) inset 의
// 단일 출처가 CSS env() 인가.
function renderLayout() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<div data-testid="outlet-content">content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('Layout safe-area parity 계약', () => {
  it('외부 셸 배경이 콘텐츠색(bg-white/dark:bg-gray-900)으로 통일돼 노치 영역에 회색 plane 이 노출되지 않는다', () => {
    const { container } = renderLayout();
    const shell = container.firstElementChild as HTMLElement;
    expect(shell).not.toBeNull();
    // 통일된 배경: 회색 부모 plane 재도입(bg-gray-100/dark:bg-gray-950) 시 fail.
    expect(shell.className).toContain('bg-white');
    expect(shell.className).toContain('dark:bg-gray-900');
    expect(shell.className).not.toContain('bg-gray-100');
    expect(shell.className).not.toContain('dark:bg-gray-950');
  });

  it('inset 컨테이너는 4-edge 모두 CSS env(safe-area-inset-*) 만 소비한다 (SDK-inset 경로 재도입 방지)', () => {
    // 소스 텍스트 계약(jsdom 한계로 렌더 DOM 검증 불가 — 위 LAYOUT_SOURCE 주석 참조).
    expect(LAYOUT_SOURCE).toContain("paddingTop: 'env(safe-area-inset-top)'");
    expect(LAYOUT_SOURCE).toContain("paddingBottom: 'env(safe-area-inset-bottom)'");
    expect(LAYOUT_SOURCE).toContain("paddingLeft: 'env(safe-area-inset-left)'");
    expect(LAYOUT_SOURCE).toContain("paddingRight: 'env(safe-area-inset-right)'");
    // SDK-inset 경로(SafeAreaInsets.get / getSafeAreaInsets / useSafeAreaInsets /
    // __WEB_VIEW_TYPE__ / var(--ait-safe-*))로 되돌려지면 fail — #187/#131 회귀 가드.
    expect(LAYOUT_SOURCE).not.toContain('useSafeAreaInsets');
    expect(LAYOUT_SOURCE).not.toContain('SafeAreaInsets');
    expect(LAYOUT_SOURCE).not.toContain('__WEB_VIEW_TYPE__');
    expect(LAYOUT_SOURCE).not.toContain('--ait-safe');
  });

  it('Outlet 콘텐츠가 렌더된다 (smoke)', () => {
    const { getByTestId } = renderLayout();
    expect(getByTestId('outlet-content')).toBeTruthy();
  });
});
