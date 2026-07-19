/**
 * `diff-ait-captures.ts`의 diff 로직 단위 테스트 — fixture record 배열로
 * 동치/불일치/커버리지 갭 판정을 검증한다. 파일 I/O(loadCaptureDir)는 순수
 * `diff()`/`compareRecords()` 함수와 분리돼 있어 여기서는 fixture만 다룬다.
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */
import { describe, expect, it } from 'vitest';
import { type CaptureRecord, compareRecords, diff } from './diff-ait-captures';

function record(overrides: Partial<CaptureRecord> = {}): CaptureRecord {
  return {
    category: 'location',
    api: 'getCurrentLocation',
    scenario: 'happy',
    input: {},
    outcome: 'resolved',
    errorName: null,
    errorCode: null,
    errorMessage: null,
    errorKeys: [],
    isNativeShape: false,
    returnType: 'object',
    valueKeys: ['latitude', 'longitude'],
    sdkLine: '2.x',
    platform: 'mock',
    ...overrides,
  };
}

describe('diff', () => {
  it('동일 (api, scenario) 키에 동일 필드 값이면 equivalent로 집계한다', () => {
    const a = [record()];
    const b = [record()];

    const result = diff(a, b);

    expect(result.totalKeys).toBe(1);
    expect(result.equivalentCount).toBe(1);
    expect(result.mismatches).toHaveLength(0);
    expect(result.onlyInA).toHaveLength(0);
    expect(result.onlyInB).toHaveLength(0);
  });

  it('outcome이 다르면 mismatch로 기록한다', () => {
    const a = [record({ outcome: 'resolved' })];
    const b = [record({ outcome: 'rejected', errorName: 'TypeError' })];

    const result = diff(a, b);

    expect(result.equivalentCount).toBe(0);
    expect(result.mismatches).toHaveLength(1);
    expect(result.mismatches[0]?.key).toBe('getCurrentLocation happy');
    const fieldNames = result.mismatches[0]?.fields.map((f) => f.field);
    expect(fieldNames).toContain('outcome');
    expect(fieldNames).toContain('errorName');
  });

  it('한쪽에만 있는 키는 mismatch가 아니라 커버리지 갭으로 집계한다', () => {
    const a = [record({ api: 'onlyA', scenario: 's1' }), record()];
    const b = [record({ api: 'onlyB', scenario: 's1' }), record()];

    const result = diff(a, b);

    expect(result.totalKeys).toBe(1); // 공통 키만 카운트
    expect(result.equivalentCount).toBe(1);
    expect(result.mismatches).toHaveLength(0);
    expect(result.onlyInA).toEqual(['onlyA s1']);
    expect(result.onlyInB).toEqual(['onlyB s1']);
  });

  // 예전 의미론은 "같은 키가 여럿이면 마지막 record 채택"(재시도 덮어쓰기)이었다.
  // 그 전제는 현 harness에서 성립하지 않는다 — THROTTLED backoff는 `capture()`를
  // 거치지 않고 `continue`하므로 재시도가 별도 record를 만들지 않고 최종 결과 한
  // 건의 `throttleRetries` 카운터로 접힌다(`src/test/aitCapture.ts`). 실제로 같은
  // 키에 record가 쌓이는 건 값 union을 순회하는 반복 시나리오뿐이고, 덮어쓰면 그
  // 관측이 사라져 거짓 동치가 생긴다(#308). 그래서 멀티셋 대조로 바꿨다.
  it('같은 키의 record를 전부 모아 shape 멀티셋으로 대조한다', () => {
    const a = [
      record({ outcome: 'rejected', errorName: 'Error', errorCode: 'NO_PERMISSION' }),
      record({ outcome: 'resolved', errorName: null }),
    ];
    const b = [record({ outcome: 'resolved', errorName: null })];

    const result = diff(a, b);

    expect(result.totalKeys).toBe(1);
    // 마지막 record만 보면 양쪽 다 resolved라 동치로 보인다 — 그게 거짓 동치다.
    expect(result.equivalentCount).toBe(0);
    expect(result.mismatches).toHaveLength(1);
  });

  it('관측 횟수까지 같아야 동치다 — shape 종류만 같고 횟수가 갈리면 불일치', () => {
    const a = [record({ outcome: 'resolved' }), record({ outcome: 'resolved' })];
    const b = [record({ outcome: 'resolved' })];

    const result = diff(a, b);

    expect(result.equivalentCount).toBe(0);
    expect(result.mismatches).toHaveLength(1);
  });

  it('반복 시나리오라도 멀티셋이 같으면 동치다 — 순서는 계약이 아니다', () => {
    const a = [record({ outcome: 'resolved' }), record({ outcome: 'timeout' })];
    const b = [record({ outcome: 'timeout' }), record({ outcome: 'resolved' })];

    const result = diff(a, b);

    expect(result.equivalentCount).toBe(1);
    expect(result.mismatches).toHaveLength(0);
  });

  it('한쪽이라도 shape가 여럿이면 필드별 상세 대신 멀티셋을 보고한다', () => {
    const a = [record({ outcome: 'resolved' }), record({ outcome: 'timeout' })];
    const b = [record({ outcome: 'resolved' }), record({ outcome: 'resolved' })];

    const result = diff(a, b);

    const [m] = result.mismatches;
    expect(m).toBeDefined();
    expect(m?.fields).toHaveLength(0);
    expect(m?.shapesA).toHaveLength(2);
    expect(m?.shapesB).toHaveLength(1);
    expect(m?.shapesB?.[0]?.count).toBe(2);
  });

  // `nonComparable`은 시나리오의 성질이지 실행분의 성질이 아니다 — 그래서 키 단위로
  // 뺀다. 특히 표식 도입 **전에** 뜬 코퍼스(실제로 env3 run11이 그렇다)에는 표식이
  // 아예 없으므로, 레코드 단위로 걸렀다면 한쪽만 빠져 불일치가 커버리지 갭으로
  // 둔갑했을 것이다 — 숫자만 옮겨 앉고 실체는 그대로인 종류의 거짓 개선이다.
  it('nonComparable 표식이 붙은 키는 양쪽에서 제외한다', () => {
    const a = [record({ api: 'probe', scenario: 'env1-only', nonComparable: '전제가 env1 전용' })];
    const b = [record({ api: 'probe', scenario: 'env1-only', outcome: 'rejected' })];

    const result = diff(a, b);

    expect(result.totalKeys).toBe(0);
    expect(result.mismatches).toHaveLength(0);
    expect(result.onlyInA).toHaveLength(0);
    expect(result.onlyInB).toHaveLength(0);
  });

  it('한쪽에만 표식이 있어도 그 키는 커버리지 갭으로 새지 않는다', () => {
    const marked = record({ api: 'probe', scenario: 'env1-only', nonComparable: '사유' });
    const plain = record({ api: 'probe', scenario: 'env1-only' });
    const other = record({ api: 'shared', scenario: 's' });

    // B에만 표식이 있는 경우(반대 방향)도 같은 답이어야 한다.
    const result = diff([plain, other], [marked, other]);

    expect(result.totalKeys).toBe(1);
    expect(result.equivalentCount).toBe(1);
    expect(result.onlyInA).toHaveLength(0);
    expect(result.onlyInB).toHaveLength(0);
  });

  it('한쪽 버킷 전체가 valueKeys를 안 갖고 있으면 그 키에서 비교를 뺀다', () => {
    const a = [record({ valueKeys: null })];
    const b = [record({ valueKeys: ['latitude'] })];

    const result = diff(a, b);

    // 게이트가 묻는 건 "이 캡처가 valueKeys를 기록하는가"다 — a쪽엔 기록한 record가
    // 하나도 없으므로(valueKeys 이전 버전 캡처) 이 키에선 서명에서 뺀다.
    expect(result.mismatches).toHaveLength(0);
    expect(result.equivalentCount).toBe(1);
  });

  it('reject record가 섞인 버킷에서도 resolved의 valueKeys 불일치를 잡는다 (#300)', () => {
    // 회귀 가드: 게이트를 `every`로 두면 reject record 하나(valueKeys: null) 때문에
    // 같은 버킷 resolved record의 valueKeys까지 서명에서 빠져 거짓 동치가 된다.
    // 나머지 필드가 전부 같으므로 "다른 필드에서 잡힌다"는 방어도 성립하지 않는다.
    const a = [
      record({ outcome: 'resolved', valueKeys: ['latitude', 'longitude'] }),
      record({ outcome: 'rejected', errorCode: 'DENIED', returnType: null, valueKeys: null }),
    ];
    const b = [
      record({ outcome: 'resolved', valueKeys: ['latitude', 'longitude', 'accuracy'] }),
      record({ outcome: 'rejected', errorCode: 'DENIED', returnType: null, valueKeys: null }),
    ];

    const result = diff(a, b);

    expect(result.mismatches).toHaveLength(1);
    expect(result.equivalentCount).toBe(0);
  });

  it('reject record가 섞여 있고 resolved가 일치하면 동치로 본다 (#300)', () => {
    // 위 가드의 짝 — null이 서명에 들어가도 양쪽 다 null이라 그대로 일치한다.
    const mixed = () => [
      record({ outcome: 'resolved', valueKeys: ['latitude', 'longitude'] }),
      record({ outcome: 'rejected', errorCode: 'DENIED', returnType: null, valueKeys: null }),
    ];

    const result = diff(mixed(), mixed());

    expect(result.mismatches).toHaveLength(0);
    expect(result.equivalentCount).toBe(1);
  });

  it('valueKeys가 양쪽 다 있고 순서만 다르면 동치로 본다(정렬 비교)', () => {
    const a = [record({ valueKeys: ['longitude', 'latitude'] })];
    const b = [record({ valueKeys: ['latitude', 'longitude'] })];

    const result = diff(a, b);

    expect(result.mismatches).toHaveLength(0);
  });

  it('valueKeys가 양쪽 다 있고 내용이 다르면 mismatch로 기록한다', () => {
    const a = [record({ valueKeys: ['latitude', 'longitude'] })];
    const b = [record({ valueKeys: ['latitude', 'longitude', 'accuracy'] })];

    const result = diff(a, b);

    expect(result.mismatches).toHaveLength(1);
    expect(result.mismatches[0]?.fields.map((f) => f.field)).toEqual(['valueKeys']);
  });
});

describe('compareRecords', () => {
  it('outcome/errorName/errorCode/returnType 중 다른 필드만 mismatch로 반환한다', () => {
    const a = record({ errorCode: 4046 });
    const b = record({ errorCode: 5001 });

    const fields = compareRecords(a, b);

    expect(fields).toEqual([{ field: 'errorCode', a: 4046, b: 5001 }]);
  });

  it('모든 비교 필드가 같으면 빈 배열을 반환한다', () => {
    const a = record();
    const b = record();

    const fields = compareRecords(a, b);

    expect(fields).toEqual([]);
  });
});

describe('booleanValues (값 축 지문)', () => {
  it('양쪽 다 있고 값이 갈리면 불일치로 잡는다 — valueKeys가 같아도', () => {
    const a = [record({ valueKeys: ['success'], booleanValues: { success: true } })];
    const b = [record({ valueKeys: ['success'], booleanValues: { success: false } })];

    const result = diff(a, b);

    expect(result.equivalentCount).toBe(0);
    expect(result.mismatches).toHaveLength(1);
  });

  it('한쪽에 필드가 없으면 비교에서 뺀다 — 표식 이전 코퍼스를 붉게 만들지 않는다', () => {
    const a = [record({ valueKeys: ['success'], booleanValues: { success: true } })];
    const b = [record({ valueKeys: ['success'] })]; // 재측정 안 한 구 코퍼스

    const result = diff(a, b);

    expect(result.equivalentCount).toBe(1);
    expect(result.mismatches).toHaveLength(0);
  });

  it('키 순서는 계약이 아니다 — 순서만 다르면 동치', () => {
    const a = [record({ booleanValues: { ok: true, done: false } })];
    const b = [record({ booleanValues: { done: false, ok: true } })];

    expect(diff(a, b).equivalentCount).toBe(1);
  });

  it('reject record가 섞인 버킷에서도 지문 불일치를 잡는다 (#300과 같은 결함)', () => {
    // 오류 경로는 `NO_VALUE_SHAPE`로 `booleanValues: null`을 남긴다. 게이트를
    // `every`로 두면 그 record 하나 때문에 같은 버킷 resolved record의 지문까지
    // 서명에서 빠져 true/false 발산이 조용히 동치로 집계된다.
    const rejected = () =>
      record({
        outcome: 'rejected',
        errorCode: 'DENIED',
        returnType: 'undefined',
        valueKeys: null,
        booleanValues: null,
      });
    const a = [record({ valueKeys: ['success'], booleanValues: { success: true } }), rejected()];
    const b = [record({ valueKeys: ['success'], booleanValues: { success: false } }), rejected()];

    const result = diff(a, b);

    expect(result.equivalentCount).toBe(0);
    expect(result.mismatches).toHaveLength(1);
  });
});
