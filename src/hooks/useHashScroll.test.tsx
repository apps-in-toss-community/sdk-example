import { renderHook } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useHashScroll } from './useHashScroll';

// jsdom 에서 scrollIntoView 는 구현이 없어 stub.
const scrollIntoViewMock = vi.fn();

beforeEach(() => {
  scrollIntoViewMock.mockClear();
  document.body.innerHTML = '';
});

function createAnchorElement(id: string): HTMLElement {
  const el = document.createElement('div');
  el.id = id;
  el.scrollIntoView = scrollIntoViewMock;
  document.body.appendChild(el);
  return el;
}

function wrapper(initialEntries: string[]) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="*" element={children} />
        </Routes>
      </MemoryRouter>
    );
  };
}

describe('useHashScroll', () => {
  it('hash 가 없으면 scrollIntoView 를 호출하지 않는다', async () => {
    renderHook(() => useHashScroll(), { wrapper: wrapper(['/environment']) });
    await new Promise((r) => setTimeout(r, 50));
    expect(scrollIntoViewMock).not.toHaveBeenCalled();
  });

  it('anchor element 가 있으면 rAF 후 scrollIntoView 를 호출한다', async () => {
    createAnchorElement('api-SafeAreaInsets');
    renderHook(() => useHashScroll(), {
      wrapper: wrapper(['/environment#api-SafeAreaInsets']),
    });
    await new Promise((r) => setTimeout(r, 50));
    expect(scrollIntoViewMock).toHaveBeenCalledOnce();
    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  it('pathname 이 바뀌면 동일 hash 라도 별도 effect 로 scroll 을 시도한다', async () => {
    createAnchorElement('api-getSafeAreaInsets');

    // 첫 번째 hook instance: /environment#api-getSafeAreaInsets
    renderHook(() => useHashScroll(), {
      wrapper: wrapper(['/environment#api-getSafeAreaInsets']),
    });
    await new Promise((r) => setTimeout(r, 50));
    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);

    scrollIntoViewMock.mockClear();

    // 두 번째 hook instance: 다른 pathname + 동일 hash
    renderHook(() => useHashScroll(), {
      wrapper: wrapper(['/storage#api-getSafeAreaInsets']),
    });
    await new Promise((r) => setTimeout(r, 50));
    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);
  });
});
