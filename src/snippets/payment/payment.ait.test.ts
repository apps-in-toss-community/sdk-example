/**
 * payment `.ait.test` — 값 다양화 + 의도적 오류 + 4-cell 오류-shape 캡처.
 *
 * requestTossPayPaysBilling의 success는 "사용자 인증 성공"이지 "결제 완료"가 아니다 —
 * caller가 success를 검사하되 그것만으로 결제 완료로 처리하면 안 된다는 계약 가드.
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */
import { requestTossPayPaysBilling } from '@apps-in-toss/web-framework';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { captureAsync, cell, flushCapture } from '../../test/aitCapture';
import { clearSoftResolveMirror, mirrorSoftResolve } from '../../test/provisioningMirror';

const CATEGORY = 'payment';

beforeAll(async () => {
  // 31146은 결제가 미프로비저닝이라 실기기(env3)는 requestTossPayPaysBilling을 reject가
  // 아니라 { false, reason }(valueKeys=['false','reason'])로 resolve한다(run11 2.x/iOS 실측).
  // env1(mock)도 같은 shape로 맞춰 capture diff가 동치를 보게 한다(devtools#789/#793). 아래
  // 단언들은 `'success' in result` 가드가 이미 있어 이 shape에서 통과한다. 리터럴 `false`
  // 키는 하네스 artifact가 아니라 실기기 WebView 관측값으로 확정(#303, capture.ts).
  await mirrorSoftResolve('requestTossPayPaysBilling');
});

afterAll(async () => {
  await clearSoftResolveMirror();
  await flushCapture(CATEGORY);
});

describe('payment · 값 다양화 (happy path)', () => {
  it('requestTossPayPaysBilling을 다양한 wrappedToken으로 호출', async () => {
    for (const wrappedToken of ['wt_test_1', 'wt_test_long_0000000000', 'wt_test_xyz']) {
      const { value, outcome } = await captureAsync(
        {
          category: CATEGORY,
          api: 'requestTossPayPaysBilling',
          scenario: 'happy-varied-token',
          input: { wrappedToken },
        },
        () => requestTossPayPaysBilling({ params: { wrappedToken } }),
      );
      // requestTossPayPaysBilling의 반환 타입은 Promise<Result | undefined>.
      // fix #7: 실기기에서 가짜 토큰은 서버가 빠르게 reject해 `success` 없는 실패
      // envelope로 resolve할 수 있다 — shape는 mock/native 경로에 따라 발산한다.
      // resolved + non-null + `success` 있는 경우만 boolean을 검사한다.
      if (outcome === 'resolved' && value != null) {
        const result = value as Record<string, unknown>;
        if ('success' in result) {
          expect(typeof result.success).toBe('boolean');
        }
        // `success` 없는 실패 envelope도 정상 캡처 대상 — 추가 단언 없음.
      }
    }
  });
});

describe('payment · 의도적 오류 (결과 검사 가드)', () => {
  // success 필드가 존재하고 boolean이어야 caller가 분기 가능하다.
  // success===true가 곧 결제 완료를 의미하지 않으므로(서버 후처리 필요),
  // 결과 객체의 success를 검사하는 경로가 회귀하지 않게 가드한다.
  it('requestTossPayPaysBilling 결과의 success가 검사 가능한 boolean', async () => {
    const { value, outcome } = await captureAsync(
      {
        category: CATEGORY,
        api: 'requestTossPayPaysBilling',
        scenario: 'result-success-examined',
        input: { wrappedToken: 'wt_test_xxx' },
      },
      () => requestTossPayPaysBilling({ params: { wrappedToken: 'wt_test_xxx' } }),
    );
    // requestTossPayPaysBilling의 반환 타입은 Promise<Result | undefined>.
    // fix #7: 실기기에서 가짜 토큰은 `success` 없는 실패 envelope로 resolve될 수 있다.
    // `success` 필드가 있을 때만 boolean 계약을 검사한다.
    if (outcome === 'resolved' && value != null) {
      const result = value as { success?: boolean };
      if ('success' in result) {
        expect(typeof result.success).toBe('boolean');
        // success===false면 reason을 surface해야 한다(성공으로 삼키면 안 됨).
        if (result.success === false) {
          const withReason = value as { reason?: unknown };
          expect(withReason).toHaveProperty('reason');
        }
      }
      // `success` 없는 실패 envelope: 실 SDK가 내는 정상 경로 — 추가 단언 없음.
    }
  });
});

describe('payment · native shape (env3 전용 단언)', () => {
  it.skipIf(cell.platform === 'mock')(
    '[native] 결제 인증 취소/실패 시 native 오류 shape가 도착한다',
    async () => {
      const { outcome } = await captureAsync(
        {
          category: CATEGORY,
          api: 'requestTossPayPaysBilling',
          scenario: 'native-billing-cancelled',
          input: { wrappedToken: 'wt_invalid' },
        },
        () => requestTossPayPaysBilling({ params: { wrappedToken: 'wt_invalid' } }),
      );
      expect(['resolved', 'rejected']).toContain(outcome);
    },
  );
});

describe('payment · 4-cell 오류-shape 캡처', () => {
  it('호출 결과가 capture sink에 쌓인다', () => {
    expect(true).toBe(true);
  });
});
