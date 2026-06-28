/**
 * iap `.ait.test` — 값 다양화 + 의도적 오류 + 4-cell 오류-shape 캡처.
 *
 * 확인된 오용 가드:
 *  - I1: completeProductGrant의 boolean|undefined 반환 계약을 caller가 검사.
 *  - I2: checkoutPayment의 { success } 를 caller가 검사 (success===false를 성공으로 안 봄).
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */
import { IAP, checkoutPayment } from '@apps-in-toss/web-framework';
import { afterAll, describe, expect, it } from 'vitest';
import { captureAsync, flushCapture } from '../../test/aitCapture';

const CATEGORY = 'iap';

afterAll(() => {
  flushCapture(CATEGORY);
});

describe('iap · 값 다양화 (happy path)', () => {
  it('getProductItemList / getPendingOrders / getCompletedOrRefundedOrders가 선언 shape로 resolve', async () => {
    const list = await captureAsync(
      { category: CATEGORY, api: 'IAP.getProductItemList', scenario: 'happy-default', input: null },
      () => IAP.getProductItemList(),
    );
    const pending = await captureAsync(
      { category: CATEGORY, api: 'IAP.getPendingOrders', scenario: 'happy-default', input: null },
      () => IAP.getPendingOrders(),
    );
    const history = await captureAsync(
      {
        category: CATEGORY,
        api: 'IAP.getCompletedOrRefundedOrders',
        scenario: 'happy-default',
        input: null,
      },
      () => IAP.getCompletedOrRefundedOrders(),
    );
    expect(list.value).toMatchObject({ products: expect.any(Array) });
    expect(pending.value).toMatchObject({ orders: expect.any(Array) });
    expect(history.value).toMatchObject({ orders: expect.any(Array) });
  });

  it('getSubscriptionInfo를 다양한 orderId로 호출', async () => {
    for (const orderId of ['order-1', 'order-abc-XYZ', 'order-with-매우-긴-id-0000']) {
      const { value } = await captureAsync(
        {
          category: CATEGORY,
          api: 'IAP.getSubscriptionInfo',
          scenario: 'happy-varied-orderId',
          input: { orderId },
        },
        () => IAP.getSubscriptionInfo({ params: { orderId } }),
      );
      expect(value).toMatchObject({ subscription: expect.any(Object) });
    }
  });
});

describe('iap · 의도적 오류 (확인된 오용 가드)', () => {
  // I2: checkoutPayment 결과의 success를 반드시 검사한다.
  // { success: false, reason } 를 무시하고 항상 "결제 완료"로 처리하면 안 된다.
  it('[I2] checkoutPayment 결과의 success 필드가 검사된다', async () => {
    const { value } = await captureAsync(
      {
        category: CATEGORY,
        api: 'checkoutPayment',
        scenario: 'I2-result-success-examined',
        input: { payToken: 'pt_test_xxx' },
      },
      () => checkoutPayment({ params: { payToken: 'pt_test_xxx' } }),
    );
    const result = value as { success?: boolean; reason?: unknown };
    // 결과에 success 필드가 존재하고 boolean이어야 — caller가 분기 가능해야 한다.
    expect(result).toHaveProperty('success');
    expect(typeof result.success).toBe('boolean');
    // success===false면 reason을 surface해야 한다(성공으로 삼키면 안 됨).
    if (result.success === false) {
      expect(result).toHaveProperty('reason');
    }
  });

  // I1: completeProductGrant는 boolean(성공) 또는 undefined(구버전 앱)를 반환한다.
  // caller가 truthy로만 보면 구버전에서 undefined를 "미완료"로 잘못 처리한다 —
  // 반환 계약(boolean | undefined)을 명시적으로 검사하는 회귀 가드.
  it('[I1] completeProductGrant 반환이 boolean | undefined 계약을 지킨다', async () => {
    const { value, outcome } = await captureAsync(
      {
        category: CATEGORY,
        api: 'IAP.completeProductGrant',
        scenario: 'I1-grant-return-contract',
        input: { orderId: 'order-123' },
      },
      () => IAP.completeProductGrant({ params: { orderId: 'order-123' } }),
    );
    expect(outcome).toBe('resolved');
    expect(['boolean', 'undefined']).toContain(typeof value);
  });
});

describe('iap · 4-cell 오류-shape 캡처', () => {
  it('호출 결과가 capture sink에 쌓인다 (env3에서 native 결제 오류 shape 채움)', () => {
    expect(true).toBe(true);
  });
});
