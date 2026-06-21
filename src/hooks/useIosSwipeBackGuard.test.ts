import { describe, expect, it } from 'vitest';
import { decideBackAction, readRouterIdx } from './useIosSwipeBackGuard';

// readRouterIdx/decideBackAction 은 순수 함수라 DOM 없이 테스트 가능하다.
// react-router v7 BrowserRouter 가 history.state 에 { idx, key } 를 stamp 한다는
// 계약을 여기서 고정한다 — 이 구조가 바뀌면 가드가 깊이를 잘못 읽으므로 테스트가 먼저 깨진다.

describe('readRouterIdx — history.state.idx 안전 추출', () => {
  it('{ idx: 0 } → 0 (router root)', () => {
    expect(readRouterIdx({ idx: 0, key: 'a' })).toBe(0);
  });

  it('{ idx: 1 } → 1 (1단계 깊이)', () => {
    expect(readRouterIdx({ idx: 1, key: 'b' })).toBe(1);
  });

  it('{ idx: 5 } → 5', () => {
    expect(readRouterIdx({ idx: 5, key: 'c' })).toBe(5);
  });

  it('null → null (stamp 없음)', () => {
    expect(readRouterIdx(null)).toBeNull();
  });

  it('undefined → null', () => {
    expect(readRouterIdx(undefined)).toBeNull();
  });

  it('{} → null (idx 없는 객체)', () => {
    expect(readRouterIdx({})).toBeNull();
  });

  it('{ idx: null } → null', () => {
    expect(readRouterIdx({ idx: null })).toBeNull();
  });

  it('{ idx: undefined } → null', () => {
    expect(readRouterIdx({ idx: undefined, key: 'd' })).toBeNull();
  });

  it('42 → null (객체 아님)', () => {
    expect(readRouterIdx(42)).toBeNull();
  });

  it("'foo' → null (문자열)", () => {
    expect(readRouterIdx('foo')).toBeNull();
  });
});

describe('decideBackAction — 깊이 × 정책 → 행동', () => {
  // idx >= 1 = 깊은 화면 → 정책 무관 in-app 뒤로가기
  it('idx 1, close → pop (in-app 뒤로가기)', () => {
    expect(decideBackAction(1, 'close')).toBe('pop');
  });

  it('idx 5, close → pop', () => {
    expect(decideBackAction(5, 'close')).toBe('pop');
  });

  it('idx 1, stay → pop (깊은 화면은 정책 무관 pop)', () => {
    expect(decideBackAction(1, 'stay')).toBe('pop');
  });

  // idx 0 = router root = history floor → 정책에 따라 종료/미종료
  it('idx 0, close → close (root 에서 토스 기본 종료)', () => {
    expect(decideBackAction(0, 'close')).toBe('close');
  });

  it('idx 0, stay → noop (root 미종료)', () => {
    expect(decideBackAction(0, 'stay')).toBe('noop');
  });

  // idx 판독 불가(null) = stamp 깨짐 → root 로 안전 취급
  it('null, close → close (stamp 불가 시 root 로 안전 종료)', () => {
    expect(decideBackAction(null, 'close')).toBe('close');
  });

  it('null, stay → noop', () => {
    expect(decideBackAction(null, 'stay')).toBe('noop');
  });

  // 실기기 측정값 재현 — 홈(idx 0)은 종료, /location(idx 1)은 in-app back
  it('홈 실기기 측정값 idx 0, close → close (미니앱 종료)', () => {
    expect(decideBackAction(0, 'close')).toBe('close');
  });

  it('/location 실기기 측정값 idx 1, close → pop (in-app back)', () => {
    expect(decideBackAction(1, 'close')).toBe('pop');
  });
});
