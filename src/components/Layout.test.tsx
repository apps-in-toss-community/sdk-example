/**
 * Layout safe-area inset 회귀 가드 (#170)
 *
 * 검증 목표:
 * 1. 컨테이너 inline style에 --ait-safe-* 및 --safe-top의 raw env() 재정의가 없음
 * 2. padding-{top,bottom,left,right} 이 var(--ait-safe-*) 를 소비하는 형태임
 * 3. --safe-top 은 var(--ait-safe-top, ...) 형태로 전달됨
 *
 * 환경 2(devtools launcher PWA)에서 iOS WebKit 크로스-오리진 iframe이
 * phantom safe-area-inset-top/bottom을 노출하는 결함(#170)을 막기 위해,
 * Layout은 raw env(safe-area-inset-*) 를 padding에 직접 쓰지 않는다.
 * 변수 작성자는 useSafeAreaInsets(root)이고, Layout은 그 변수를 소비만 한다.
 */
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Layout } from './Layout';

function renderLayout() {
  return render(
    <MemoryRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<div data-testid="page-content">content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

/** Layout 컨테이너 요소 — max-w-5xl을 가진 inner div */
function getContainer(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('.max-w-5xl');
  if (!el) throw new Error('Layout container (.max-w-5xl) not found');
  return el;
}

describe('Layout safe-area padding (#170)', () => {
  it('padding-top consumes var(--ait-safe-top) — not raw env()', () => {
    const { container } = renderLayout();
    const el = getContainer(container);
    // var() 소비 형태여야 한다 — raw env(safe-area-inset-top)로 시작하면 안 됨
    expect(el.style.paddingTop).toMatch(/^var\(--ait-safe-top/);
  });

  it('padding-bottom consumes var(--ait-safe-bottom) — not raw env()', () => {
    const { container } = renderLayout();
    const el = getContainer(container);
    expect(el.style.paddingBottom).toMatch(/^var\(--ait-safe-bottom/);
  });

  it('padding-left consumes var(--ait-safe-left) — not raw env()', () => {
    const { container } = renderLayout();
    const el = getContainer(container);
    expect(el.style.paddingLeft).toMatch(/^var\(--ait-safe-left/);
  });

  it('padding-right consumes var(--ait-safe-right) — not raw env()', () => {
    const { container } = renderLayout();
    const el = getContainer(container);
    expect(el.style.paddingRight).toMatch(/^var\(--ait-safe-right/);
  });

  it('--safe-top is forwarded as var(--ait-safe-top, ...) — not raw env()', () => {
    const { container } = renderLayout();
    const el = getContainer(container);
    const safeTop = el.style.getPropertyValue('--safe-top');
    // --safe-top 자체를 raw env()로 지정하면 phantom inset을 그대로 전달하게 됨
    expect(safeTop).toMatch(/^var\(--ait-safe-top/);
  });

  it('does not define --ait-safe-top on the container (root is the sole author)', () => {
    const { container } = renderLayout();
    const el = getContainer(container);
    // useSafeAreaInsets(:root)만이 --ait-safe-* 변수의 작성자여야 한다
    expect(el.style.getPropertyValue('--ait-safe-top')).toBe('');
  });

  it('does not define --ait-safe-bottom on the container', () => {
    const { container } = renderLayout();
    const el = getContainer(container);
    expect(el.style.getPropertyValue('--ait-safe-bottom')).toBe('');
  });

  it('does not define --ait-safe-left on the container', () => {
    const { container } = renderLayout();
    const el = getContainer(container);
    expect(el.style.getPropertyValue('--ait-safe-left')).toBe('');
  });

  it('does not define --ait-safe-right on the container', () => {
    const { container } = renderLayout();
    const el = getContainer(container);
    expect(el.style.getPropertyValue('--ait-safe-right')).toBe('');
  });
});
