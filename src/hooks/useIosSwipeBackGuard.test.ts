import { describe, expect, it } from 'vitest';
import { decideGestureEnabled, readRouterIdx } from './useIosSwipeBackGuard';

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
