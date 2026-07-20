import { getOperationalEnvironment, setIosSwipeGestureEnabled } from '@apps-in-toss/web-framework';
import { renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  decideGestureEnabled,
  isTossWebView,
  readRouterIdx,
  useIosSwipeBackGuard,
} from './useIosSwipeBackGuard';

// getOperationalEnvironment/setIosSwipeGestureEnabled 를 테스트마다 다른 값으로 제어하기
// 위한 mock. 상류 .d.ts는 getOperationalEnvironment를 동기(`"toss" | "sandbox"`)로
// 선언하지만, 이 mock은 실기기 런타임(Promise 반환, devtools#795/#796)을 재현한다 —
// mockResolvedValue가 바로 그 "선언은 동기, 런타임은 Promise" 발산을 만드는 지점이다.
vi.mock('@apps-in-toss/web-framework', () => ({
  getOperationalEnvironment: vi.fn(),
  setIosSwipeGestureEnabled: vi.fn(),
}));

const mockedGetOperationalEnvironment = vi.mocked(getOperationalEnvironment);
const mockedSetIosSwipeGestureEnabled = vi.mocked(setIosSwipeGestureEnabled);

// readRouterIdx 는 순수 함수라 DOM 없이 테스트 가능하다.
// react-router v7 BrowserRouter 가 history.state 에 { idx, key } 를 stamp 한다는
// 계약을 여기서 고정한다 — 이 구조가 바뀌면 guard 가 오작동하므로 테스트가 먼저 깨진다.

describe('readRouterIdx — history.state.idx 안전 읽기', () => {
  it('null → null', () => {
    expect(readRouterIdx(null)).toBeNull();
  });

  it('undefined → null', () => {
    expect(readRouterIdx(undefined)).toBeNull();
  });

  it('number → null (객체가 아님)', () => {
    expect(readRouterIdx(42)).toBeNull();
  });

  it('string → null', () => {
    expect(readRouterIdx('foo')).toBeNull();
  });

  it('빈 객체 → null (idx 없음)', () => {
    expect(readRouterIdx({})).toBeNull();
  });

  it('{ key } 만 있는 객체 → null', () => {
    expect(readRouterIdx({ key: 'abc' })).toBeNull();
  });

  it('{ idx: undefined } → null', () => {
    expect(readRouterIdx({ idx: undefined, key: 'abc' })).toBeNull();
  });

  it('{ idx: null } → null', () => {
    expect(readRouterIdx({ idx: null, key: 'abc' })).toBeNull();
  });

  it('{ idx: "1" } → null (문자열 idx는 number가 아님)', () => {
    expect(readRouterIdx({ idx: '1', key: 'abc' })).toBeNull();
  });

  it('{ idx: 0 } → 0', () => {
    expect(readRouterIdx({ idx: 0, key: 'home-key' })).toBe(0);
  });

  it('{ idx: 1 } → 1', () => {
    expect(readRouterIdx({ idx: 1, key: 'def' })).toBe(1);
  });

  it('{ idx: 5 } → 5', () => {
    expect(readRouterIdx({ idx: 5, key: 'xyz' })).toBe(5);
  });
});

describe('decideGestureEnabled — 깊이 → 네이티브 제스처 on/off', () => {
  it('idx 0 → true (root: swipe = 정상 종료, 켠다)', () =>
    expect(decideGestureEnabled(0)).toBe(true));
  it('idx 1 → false (deep: 셸 밖 pop 방지, 끈다)', () =>
    expect(decideGestureEnabled(1)).toBe(false));
  it('idx 5 → false (깊은 화면도 끔)', () => expect(decideGestureEnabled(5)).toBe(false));
  it('null → true (판독 불가 → root 취급, 갇힘 방지 우선)', () =>
    expect(decideGestureEnabled(null)).toBe(true));
  it('홈 측정 idx 0 → true', () => expect(decideGestureEnabled(0)).toBe(true));
  it('/permissions 측정 idx 1 → false', () => expect(decideGestureEnabled(1)).toBe(false));
});

// isTossWebView — getOperationalEnvironment() 는 상류 타입상 동기 string 반환이지만
// 실기기 런타임은 Promise 를 반환한다(devtools#795/#796, env3 실측). 이 회귀 전에는
// `getOperationalEnvironment() === 'toss'` 를 동기 비교해 `Promise === 'toss'` 가 항상
// false 였다 — 아래 'toss' 케이스는 그 옛 동기 비교로는 실패하고 await 도입 후에만
// 통과한다.
describe('isTossWebView — getOperationalEnvironment() await (sync/async 발산 회귀 가드)', () => {
  beforeEach(() => {
    mockedGetOperationalEnvironment.mockReset();
  });

  afterEach(() => {
    delete (window as { ReactNativeWebView?: unknown }).ReactNativeWebView;
  });

  it("getOperationalEnvironment 가 Promise.resolve('toss') 를 반환하면 true (옛 동기 비교 `Promise === 'toss'` 로는 항상 false 라 이 케이스가 회귀를 잡는다)", async () => {
    mockedGetOperationalEnvironment.mockResolvedValue('toss');
    await expect(isTossWebView()).resolves.toBe(true);
  });

  it("getOperationalEnvironment 가 Promise.resolve('sandbox') 를 반환하면 false", async () => {
    mockedGetOperationalEnvironment.mockResolvedValue('sandbox');
    await expect(isTossWebView()).resolves.toBe(false);
  });

  it('getOperationalEnvironment 가 동기적으로 throw 하면 ReactNativeWebView 마커로 fallback — 마커 있음 → true', async () => {
    mockedGetOperationalEnvironment.mockImplementation(() => {
      throw new Error('__CONSTANT_HANDLER_MAP not initialized');
    });
    (window as { ReactNativeWebView?: unknown }).ReactNativeWebView = {};
    await expect(isTossWebView()).resolves.toBe(true);
  });

  it('getOperationalEnvironment 가 동기적으로 throw 하면 ReactNativeWebView 마커로 fallback — 마커 없음 → false', async () => {
    mockedGetOperationalEnvironment.mockImplementation(() => {
      throw new Error('__CONSTANT_HANDLER_MAP not initialized');
    });
    await expect(isTossWebView()).resolves.toBe(false);
  });
});

describe('useIosSwipeBackGuard — toss 환경에서만 setIosSwipeGestureEnabled 가 호출된다', () => {
  function wrapper({ children }: { children: React.ReactNode }) {
    return <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter>;
  }

  beforeEach(() => {
    mockedGetOperationalEnvironment.mockReset();
    mockedSetIosSwipeGestureEnabled.mockReset().mockResolvedValue(undefined);
  });

  it('toss 환경이면 setIosSwipeGestureEnabled 가 결국 호출된다', async () => {
    mockedGetOperationalEnvironment.mockResolvedValue('toss');

    renderHook(() => useIosSwipeBackGuard(), { wrapper });

    await waitFor(() => {
      expect(mockedSetIosSwipeGestureEnabled).toHaveBeenCalled();
    });
  });

  it('toss 환경이 아니면 setIosSwipeGestureEnabled 가 호출되지 않는다', async () => {
    mockedGetOperationalEnvironment.mockResolvedValue('sandbox');

    renderHook(() => useIosSwipeBackGuard(), { wrapper });

    // isTossWebView() 의 await 가 소화될 시간을 준 뒤에도 호출되지 않았는지 확인.
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(mockedSetIosSwipeGestureEnabled).not.toHaveBeenCalled();
  });
});
