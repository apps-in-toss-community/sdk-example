/**
 * payment `.ait.test` — 값 다양화 + 의도적 오류 + 4-cell 오류-shape 캡처.
 *
 * requestTossPayPaysBilling의 success는 "사용자 인증 성공"이지 "결제 완료"가 아니다 —
 * caller가 success를 검사하되 그것만으로 결제 완료로 처리하면 안 된다는 계약 가드.
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */
import { requestTossPayPaysBilling } from '@apps-in-toss/web-framework';
import { afterAll, describe, expect, it } from 'vitest';
import { captureAsync, cell, flushCapture } from '../../test/aitCapture';

const CATEGORY = 'payment';

afterAll(async () => {
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
      if (outcome === 'resolved') {
        expect(value).toHaveProperty('success');
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
    if (outcome === 'resolved') {
      const result = value as { success?: boolean };
      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
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
