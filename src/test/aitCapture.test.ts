/**
 * `captureCallback` / `captureAsync` 유닛 테스트 — 이벤트-구독형 API 캡처
 * 헬퍼(#261)와 per-call race 타임아웃(#274)의 계약을 SDK 없이 순수
 * handler/run 또는 Promise 조합으로 검증한다.
 *
 * `captureCallback` 4 케이스:
 *  1. onEvent 발화 → 'resolved'-등가 + cleanup 호출
 *  2. onError 발화 → 'rejected' + cleanup 호출
 *  3. 아무 것도 발화 안 함 → ~3s 내 'callback-timeout' + cleanup 호출 (fake timers)
 *  4. cleanup이 던지는 예외는 삼켜져 outcome을 가리지 않는다
 *
 * `captureAsync` `raceTimeoutMs` 케이스(#274):
 *  1. call()이 타이머보다 먼저 resolve → 기존 동작 그대로('resolved', race 미발동)
 *  2. call()이 타이머보다 느림(hang) → 'timeout' outcome + sink record
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  __getPendingRecordsForTest,
  captureAsync,
  captureCallback,
  captureSync,
} from './aitCapture';

const meta = {
  category: 'test-infra',
  api: 'fakeSubscribe',
  scenario: 'unit',
  input: null,
};

describe('captureCallback', () => {
  it('onEvent 발화 → resolved + value + cleanup 호출', async () => {
    const cleanup = vi.fn();
    const result = await captureCallback(meta, ({ onEvent }) => {
      onEvent({ ok: true });
      return cleanup;
    });

    expect(result.outcome).toBe('resolved');
    expect(result.value).toEqual({ ok: true });
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('onError 발화 → rejected + error + cleanup 호출', async () => {
    const cleanup = vi.fn();
    const err = new Error('boom');
    const result = await captureCallback(meta, ({ onError }) => {
      onError(err);
      return cleanup;
    });

    expect(result.outcome).toBe('rejected');
    expect(result.error).toBe(err);
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  describe('아무 것도 발화하지 않는 경우', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('~3s 내 callback-timeout으로 정착하고 cleanup을 호출한다 (rejected로 오기록하지 않음)', async () => {
      const cleanup = vi.fn();
      const promise = captureCallback(meta, () => cleanup);

      // 아직 timeout 전 — 미정착.
      await vi.advanceTimersByTimeAsync(2999);
      expect(cleanup).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(1);
      const result = await promise;

      expect(result.outcome).toBe('callback-timeout');
      expect(result.error).toBeUndefined();
      expect(cleanup).toHaveBeenCalledTimes(1);
    });

    it('timeoutMs override — 커스텀 시간에 정착한다', async () => {
      const cleanup = vi.fn();
      const promise = captureCallback({ ...meta, timeoutMs: 100 }, () => cleanup);

      await vi.advanceTimersByTimeAsync(100);
      const result = await promise;

      expect(result.outcome).toBe('callback-timeout');
      expect(cleanup).toHaveBeenCalledTimes(1);
    });
  });

  it('cleanup이 예외를 던져도 삼켜져 원래 outcome을 가리지 않는다', async () => {
    const result = await captureCallback(meta, ({ onEvent }) => {
      onEvent('value');
      return () => {
        throw new Error('cleanup exploded');
      };
    });

    expect(result.outcome).toBe('resolved');
    expect(result.value).toBe('value');
  });

  it('cleanup 없이(undefined 반환) run해도 정상 정착한다', async () => {
    const result = await captureCallback(meta, ({ onEvent }) => {
      onEvent(1);
      // cleanup 반환 없음
    });

    expect(result.outcome).toBe('resolved');
    expect(result.value).toBe(1);
  });

  it('onEvent가 먼저 발화하면 이후 onError는 무시된다 (한 번만 정착)', async () => {
    const cleanup = vi.fn();
    let laterOnError: ((e: unknown) => void) | undefined;
    const result = await captureCallback(meta, ({ onEvent, onError }) => {
      laterOnError = onError;
      onEvent('first');
      return cleanup;
    });

    laterOnError?.(new Error('too-late'));

    expect(result.outcome).toBe('resolved');
    expect(result.value).toBe('first');
    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});

describe('captureAsync raceTimeoutMs (#274)', () => {
  const meta = {
    category: 'test-infra',
    api: 'fakeAsyncCall',
    scenario: 'unit',
    input: null,
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('call()이 타이머보다 먼저 resolve하면 기존 동작 그대로 resolved를 낸다', async () => {
    const promise = captureAsync(meta, () => Promise.resolve({ ok: true }), {
      raceTimeoutMs: 5_000,
    });

    // race 타이머가 발동하기 전에 이미 resolve됨 — 즉시 정착해야 한다.
    const result = await promise;

    expect(result.outcome).toBe('resolved');
    expect(result.value).toEqual({ ok: true });
  });

  it('call()이 hang하면 raceTimeoutMs 경과 후 timeout outcome + sink record를 낸다', async () => {
    // 절대 resolve/reject하지 않는 native call을 흉내 — 원본은 dangling으로 버려진다.
    const hungCall = () => new Promise<unknown>(() => {});
    const promise = captureAsync(meta, hungCall, { raceTimeoutMs: 5_000 });

    // 아직 타임아웃 전 — 미정착.
    await vi.advanceTimersByTimeAsync(4_999);

    await vi.advanceTimersByTimeAsync(1);
    const result = await promise;

    expect(result.outcome).toBe('timeout');
    expect(result.value).toBeUndefined();
    expect(result.error).toBeUndefined();
  });
});

describe('CaptureMeta 필드 전달 (조용한 누락 방지)', () => {
  // 세 진입점이 record를 조립하는 방식이 다르다 — captureAsync/captureSync는
  // `...meta`를 스프레드하지만 captureCallback은 outcome 확정 지점이 셋이라
  // 필드를 손으로 옮긴다. 그래서 `CaptureMeta`에 필드를 더해도 captureCallback
  // 경로에서만 누락될 수 있고, optional 필드라 타입 검사도 안 잡는다.
  // `nonComparable` 도입 때 실제로 이 방식으로 새서 events 3건이 격리되지 않았다.
  const withReason = { ...meta, nonComparable: 'env1 전용 전제 — 단위 테스트' };

  function reasonOf(api: string): unknown {
    const rec = __getPendingRecordsForTest().find(
      (r) => r.api === api && r.scenario === meta.scenario,
    );
    return rec?.nonComparable;
  }

  it('captureCallback이 nonComparable을 record까지 옮긴다', async () => {
    await captureCallback({ ...withReason, api: 'cb-forward' }, ({ onEvent }) => {
      onEvent({ ok: true });
      return () => {};
    });

    expect(reasonOf('cb-forward')).toBe(withReason.nonComparable);
  });

  it('captureAsync가 nonComparable을 record까지 옮긴다', async () => {
    await captureAsync({ ...withReason, api: 'async-forward' }, async () => ({ ok: true }));

    expect(reasonOf('async-forward')).toBe(withReason.nonComparable);
  });

  it('captureSync가 nonComparable을 record까지 옮긴다', () => {
    captureSync({ ...withReason, api: 'sync-forward' }, () => ({ ok: true }));

    expect(reasonOf('sync-forward')).toBe(withReason.nonComparable);
  });

  it('표식을 안 준 호출은 record에 사유가 붙지 않는다 (기본값 오염 방지)', async () => {
    await captureAsync({ ...meta, api: 'no-reason' }, async () => ({ ok: true }));

    expect(reasonOf('no-reason')).toBeUndefined();
  });
});

describe('booleanValues (값 축 지문)', () => {
  function booleansOf(api: string): unknown {
    return __getPendingRecordsForTest().find((r) => r.api === api && r.scenario === meta.scenario)
      ?.booleanValues;
  }

  it('객체 반환의 boolean 필드만 값째로 싣는다 — string/number는 안 싣는다', async () => {
    await captureAsync({ ...meta, api: 'bv-object' }, async () => ({
      success: true,
      hasNext: false,
      token: 'secret-value',
      amount: 1000,
    }));

    expect(booleansOf('bv-object')).toEqual({ success: true, hasNext: false });
  });

  it('boolean이 하나도 없으면 null — 빈 객체를 만들지 않는다', async () => {
    await captureAsync({ ...meta, api: 'bv-none' }, async () => ({ token: 'abc' }));

    expect(booleansOf('bv-none')).toBeNull();
  });

  it('스칼라 boolean 반환은 self 키로 싣는다', async () => {
    await captureAsync({ ...meta, api: 'bv-scalar' }, async () => false);

    expect(booleansOf('bv-scalar')).toEqual({ self: false });
  });

  it('reject하면 값 축이 없다', async () => {
    await captureAsync({ ...meta, api: 'bv-reject' }, async () => {
      throw new Error('nope');
    });

    expect(booleansOf('bv-reject')).toBeNull();
  });
});
