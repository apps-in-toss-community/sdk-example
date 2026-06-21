import { describe, expect, it } from 'vitest';
import { shouldAbsorbPop } from './App';

// shouldAbsorbPop 은 순수 함수라 DOM 없이 테스트 가능하다.
// react-router v7 BrowserRouter 가 history.state 에 { idx, key } 를 stamp 한다는
// 계약을 여기서 고정한다 — 이 구조가 바뀌면 guard 가 오작동하므로 테스트가 먼저 깨진다.

describe('shouldAbsorbPop — popstate root-guard 판정 함수', () => {
  // sentinel 엔트리 (react-router 가 아니라 guard 가 직접 push 한 null-state)
  it('state === null → 흡수 (sentinel 엔트리)', () => {
    expect(shouldAbsorbPop(null)).toBe(true);
  });

  it('state === undefined → 흡수 (브라우저 초기 엔트리)', () => {
    expect(shouldAbsorbPop(undefined)).toBe(true);
  });

  it('state 가 객체가 아닌 경우 → 흡수 (예: number/string)', () => {
    expect(shouldAbsorbPop(42)).toBe(true);
    expect(shouldAbsorbPop('foo')).toBe(true);
  });

  it('state 에 idx 가 없는 객체 → 흡수 (react-router stamp 없음)', () => {
    expect(shouldAbsorbPop({})).toBe(true);
    expect(shouldAbsorbPop({ key: 'abc' })).toBe(true);
  });

  it('state.idx === undefined → 흡수', () => {
    expect(shouldAbsorbPop({ idx: undefined, key: 'abc' })).toBe(true);
  });

  it('state.idx === null → 흡수', () => {
    expect(shouldAbsorbPop({ idx: null, key: 'abc' })).toBe(true);
  });

  it('state.idx < 0 → 흡수 (floor 아래로 pop)', () => {
    expect(shouldAbsorbPop({ idx: -1, key: 'abc' })).toBe(true);
  });

  // 정상 react-router 엔트리 — 통과 (흡수 안 함)
  it('state.idx === 0 → 통과 (root 엔트리, react-router 가 처리)', () => {
    expect(shouldAbsorbPop({ idx: 0, key: 'abc' })).toBe(false);
  });

  it('state.idx === 1 → 통과 (1단계 깊이, /location 등)', () => {
    expect(shouldAbsorbPop({ idx: 1, key: 'def' })).toBe(false);
  });

  it('state.idx 가 큰 양수 → 통과', () => {
    expect(shouldAbsorbPop({ idx: 5, key: 'xyz' })).toBe(false);
  });

  // 실기기 측정값 재현 — 홈(idx=0)·/location(idx=1) 도달 시 guard 미개입
  it('홈 실기기 측정값 { idx: 0 } → 통과 (미종료)', () => {
    expect(shouldAbsorbPop({ idx: 0, key: 'home-key' })).toBe(false);
  });

  it('/location 실기기 측정값 { idx: 1 } → 통과 (in-app back)', () => {
    expect(shouldAbsorbPop({ idx: 1, key: 'location-key' })).toBe(false);
  });
});
