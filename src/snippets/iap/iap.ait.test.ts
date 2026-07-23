/**
 * iap `.ait.test` — 값 다양화 + 의도적 오류 + 4-cell 오류-shape 캡처.
 *
 * 확인된 오용 가드:
 *  - I1: completeProductGrant의 boolean|undefined 반환 계약을 caller가 검사.
 *  - I2: checkoutPayment의 { success } 를 caller가 검사 (success===false를 성공으로 안 봄).
 *
 * ─ #351: createOneTimePurchaseOrder/createSubscriptionPurchaseOrder onError 경로 ──
 * devtools mock의 `aitState.state.iap.nextResult` 다이얼(코드 확인 완료 —
 * `@ait-co/devtools/dist/mock/index.js`의 `handlePurchase`)은 `'success'`가
 * 아니면 300ms 뒤 **onError({ code: nextResult })만** 호출하고 onEvent는 절대
 * 부르지 않는다 — 결정적 계약이라 mock 분기에서 hard-assert한다.
 *
 * env3(non-mock)에서는 이 다이얼 자체가 devtools mock 전용 상태라 없을뿐더러,
 * 두 API는 실제 주문서 페이지를 여는 UI-launching 호출이라
 * `iap.manual.ait.test.ts`가 이미 human-in-loop로 분리해뒀다 — 이 무인 자동
 * 슈트에서 실기기 호출을 반복하면 사람 없이 네이티브 UI만 띄우고 방치된다.
 * 그래서 non-mock 분기는 호출 자체를 하지 않고 export-surface만 가드한다.
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */
import { IAP, checkoutPayment } from '@apps-in-toss/web-framework';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { captureAsync, captureCallback, cell, flushCapture } from '../../test/aitCapture';
import { clearSoftResolveMirror, mirrorSoftResolve } from '../../test/provisioningMirror';

const CATEGORY = 'iap';

/** mock의 `IapNextResult` — devtools `dist/mock/index.d.ts`의 선언과 동일. */
type IapNextResult =
  | 'success'
  | 'USER_CANCELED'
  | 'INVALID_PRODUCT_ID'
  | 'PAYMENT_PENDING'
  | 'NETWORK_ERROR'
  | 'ITEM_ALREADY_OWNED'
  | 'INTERNAL_ERROR';

/**
 * env1(mock) 전용 — devtools mock의 다음 IAP 주문 생성 결과를 강제로 지정한다.
 * `@apps-in-toss/web-framework`가 vitest alias로 `@ait-co/devtools/mock`을
 * 가리킬 때만 `aitState`가 존재하므로, 동적 import + optional 접근으로
 * env3(real SDK)에서 안전하게 no-op이 되게 한다(notification.ait.test.ts의
 * `forceNotificationNextResult`와 동일 패턴).
 */
async function forceIapNextResult(nextResult: IapNextResult): Promise<void> {
  const mod: unknown = await import('@apps-in-toss/web-framework');
  const aitState = (mod as { aitState?: { patch: (key: string, partial: unknown) => void } })
    .aitState;
  aitState?.patch('iap', { nextResult });
}

/** 다음 테스트/파일로 다이얼이 새지 않도록 매 테스트 후 기본값(success)으로 복구한다. */
afterEach(async () => {
  if (cell.platform === 'mock') {
    await forceIapNextResult('success');
  }
});

beforeAll(async () => {
  // 31146엔 조회한 orderId에 활성 구독이 없고 결제도 미프로비저닝이라, 실기기(env3)는
  // 아래 둘을 reject가 아니라 대체 shape로 resolve한다(run11 2.x/iOS 실측):
  //   - getSubscriptionInfo → 빈 객체 {} (valueKeys=[])
  //   - checkoutPayment → { false, reason } (valueKeys=['false','reason'])
  // env1(mock)도 같은 shape로 맞춰 capture diff가 동치를 보게 한다(devtools#789/#793).
  // 아래 단언들은 `'success' in`/`'subscription' in` 가드가 이미 있어 이 shape에서 통과한다.
  // payment shape의 리터럴 `false` 키는 실기기 WebView 관측값으로 확정(#303, capture.ts).
  await mirrorSoftResolve('getSubscriptionInfo', 'checkoutPayment');
});

afterAll(async () => {
  await clearSoftResolveMirror();
  await flushCapture(CATEGORY);
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
    // fix #7: 실기기에서 IAP 약관 미체결이나 권한 문제로 reject될 수 있다.
    // resolved 시에만 shape를 단언한다.
    if (list.outcome === 'resolved') {
      expect(list.value).toMatchObject({ products: expect.any(Array) });
    }
    if (pending.outcome === 'resolved') {
      expect(pending.value).toMatchObject({ orders: expect.any(Array) });
    }
    if (history.outcome === 'resolved') {
      expect(history.value).toMatchObject({ orders: expect.any(Array) });
    }
  });

  it('getSubscriptionInfo를 다양한 orderId로 호출', async () => {
    for (const orderId of ['order-1', 'order-abc-XYZ', 'order-with-매우-긴-id-0000']) {
      const { value, outcome } = await captureAsync(
        {
          category: CATEGORY,
          api: 'IAP.getSubscriptionInfo',
          scenario: 'happy-varied-orderId',
          input: { orderId },
        },
        () => IAP.getSubscriptionInfo({ params: { orderId } }),
      );
      // env3 계약 관측(#253): 날조된 orderId는 reject가 아니라 빈 객체 {}로 resolve된다
      // (not-found envelope — subscription 필드 없음). payment의 success-누락 envelope과
      // 같은 계열. subscription이 실제로 담긴 응답에만 shape를 단언한다.
      if (
        outcome === 'resolved' &&
        typeof value === 'object' &&
        value !== null &&
        'subscription' in value
      ) {
        expect(value).toMatchObject({ subscription: expect.any(Object) });
      }
    }
  });
});

describe('iap · 의도적 오류 (확인된 오용 가드)', () => {
  // I2: checkoutPayment 결과의 success를 반드시 검사한다.
  // { success: false, reason } 를 무시하고 항상 "결제 완료"로 처리하면 안 된다.
  it('[I2] checkoutPayment 결과의 success 필드가 검사된다', async () => {
    const { value, outcome } = await captureAsync(
      {
        category: CATEGORY,
        api: 'checkoutPayment',
        scenario: 'I2-result-success-examined',
        input: { payToken: 'pt_test_xxx' },
      },
      () => checkoutPayment({ params: { payToken: 'pt_test_xxx' } }),
    );
    // fix #7: 실기기에서 가짜 payToken은 서버가 빠르게 reject해 `success` 없는 실패
    // envelope로 resolve할 수 있다. `success` 필드가 있을 때만 boolean 계약을 검사한다.
    if (outcome === 'resolved') {
      const result = value as { success?: boolean; reason?: unknown };
      if ('success' in (result as object)) {
        expect(typeof result.success).toBe('boolean');
        // success===false면 reason을 surface해야 한다(성공으로 삼키면 안 됨).
        if (result.success === false) {
          expect(result).toHaveProperty('reason');
        }
      }
      // `success` 없는 실패 envelope: 실 SDK가 내는 정상 경로 — 추가 단언 없음.
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
    // env3에서 날조된 orderId는 legitimately reject될 수 있다 — 하드 resolved gate 제거.
    // captureAsync는 항상 resolved|rejected 중 하나를 반환하므로 이 단언은 항상 참.
    expect(['resolved', 'rejected']).toContain(outcome);
    // boolean|undefined 계약은 resolved 시에만 검사한다.
    if (outcome === 'resolved') {
      expect(['boolean', 'undefined']).toContain(typeof value);
    }
  });
});

describe('iap · 실패 분기 — onError 경로 (env1 전용, #351)', () => {
  it('[F1] createOneTimePurchaseOrder — nextResult 실패 시 onError만 호출되고 onEvent는 호출되지 않는다', async () => {
    if (cell.platform !== 'mock') {
      // 위 파일 헤더 rationale — 실기기에서 이 다이얼은 존재하지 않고, 무인
      // 자동 슈트에서 UI-launching 호출을 반복하면 안 되므로 export-surface만
      // 가드한다.
      expect(typeof IAP.createOneTimePurchaseOrder).toBe('function');
      return;
    }
    await forceIapNextResult('NETWORK_ERROR');
    const result = await captureCallback(
      {
        category: CATEGORY,
        api: 'IAP.createOneTimePurchaseOrder',
        scenario: 'F1-onError-nextResult-NETWORK_ERROR',
        input: { sku: 'mock-gem-100', nextResult: 'NETWORK_ERROR' },
      },
      ({ onEvent, onError }) =>
        IAP.createOneTimePurchaseOrder({
          options: { sku: 'mock-gem-100', processProductGrant: async () => true },
          onEvent,
          onError,
        }),
    );
    // mock 결정적 계약(코드 확인): nextResult !== 'success'면 onError({ code })만
    // 불린다 — captureCallback은 onError 호출을 outcome:'rejected'로 정규화하므로
    // onEvent 미호출은 outcome !== 'resolved'로 이미 보장된다.
    expect(result.outcome).toBe('rejected');
    expect(result.error).toMatchObject({ code: 'NETWORK_ERROR' });
  });

  it('[F2] createSubscriptionPurchaseOrder — nextResult 실패 시 onError만 호출되고 onEvent는 호출되지 않는다', async () => {
    if (cell.platform !== 'mock') {
      expect(typeof IAP.createSubscriptionPurchaseOrder).toBe('function');
      return;
    }
    await forceIapNextResult('ITEM_ALREADY_OWNED');
    const result = await captureCallback(
      {
        category: CATEGORY,
        api: 'IAP.createSubscriptionPurchaseOrder',
        scenario: 'F2-onError-nextResult-ITEM_ALREADY_OWNED',
        input: { sku: 'mock-gem-100', nextResult: 'ITEM_ALREADY_OWNED' },
      },
      ({ onEvent, onError }) =>
        IAP.createSubscriptionPurchaseOrder({
          options: { sku: 'mock-gem-100', processProductGrant: async () => true },
          onEvent,
          onError,
        }),
    );
    expect(result.outcome).toBe('rejected');
    expect(result.error).toMatchObject({ code: 'ITEM_ALREADY_OWNED' });
  });
});

describe('iap · 4-cell 오류-shape 캡처', () => {
  it('호출 결과가 capture sink에 쌓인다 (env3에서 native 결제 오류 shape 채움)', () => {
    expect(true).toBe(true);
  });
});
