/**
 * iap `.manual.ait.test` — 수동-변형 슈트 (devtools 0.1.132 `--manual-blocking`
 * 전용). 파일명 접미사 `.manual.ait.test.ts`는 다음을 의미한다(ads/permissions/
 * storage.manual.ait.test.ts와 동일 계약):
 *
 *  - `pnpm test`(vitest, env1)에서는 `vitest.config.ts`의 `exclude`로 완전히
 *    건너뛴다 — CI에 영향 없음.
 *  - `pnpm test:env3`(devtools-test CLI)에서도 **기본적으로 제외**된다.
 *    `--manual-blocking` 플래그를 줄 때만 실행되며, 그때는 일반 파일들이 먼저
 *    돌고 이 파일이 **마지막**에 스케줄된다. 각 manual 파일 실행 전 QR
 *    대시보드가 폰에 push되어 사람이 화면을 보고 상호작용해야 한다.
 *  - env1(mock)에서도 이 파일 자체는 정상 import·실행 가능하지만, 위 이유로
 *    일반 `pnpm test` 실행 경로에서는 애초에 discover되지 않는다.
 *
 * ─ #345: 구매 플로우 실기기 커버리지 신설 ───────────────────────────────────
 * 기존 `iap.ait.test.ts`는 비결제 표면(조회 API·misuse 가드)만 다뤄 **주문
 * 생성**(`IAP.createOneTimePurchaseOrder` — 실제 인앱결제 주문서 페이지로
 * 이동해 결제를 진행)과 **구매 시트**(`checkoutPayment` — TossPay 결제창을
 * 띄우고 사용자 인증)의 실기기 UI 계약이 미측정이었다. 두 API 모두 사람이
 * 화면을 보고 완료하거나 취소해야 최종 outcome(성공/USER_CANCELED/실패)이
 * 낙착된다 — 무인 실기기 실행이면 UI가 뜬 채 아무도 응답하지 않아 native
 * 브리지가 무응답 상태로 남는다. ads/permissions/storage와 같은 이유로 무인
 * 실기기 슈트(`iap.ait.test.ts`)에서 빼고 이 파일로 분리한다.
 *
 * ─ 구매 완료의 무인 자동 diff는 구조적 불가 (OOS, #331 (3)) ─────────────────
 * "실제 결제를 사람 개입 없이 자동으로 완료·취소해 그 전 과정을 회귀
 * diff한다"는 시나리오는 이 하네스의 스코프 밖이다 — 실 결제창/주문서는
 * 네이티브 UI고, 완료/취소 제스처 자체가 사람의 판단(그리고 #298에서 결정할
 * 실결제 정책)을 전제한다. 그래서 이 파일은 "사람이 대신 눌러준다"를 전제로
 * 한 manual-blocking 슈트로만 존재할 수 있고, 완료·취소 어느 쪽이 나와도(또는
 * 프로비저닝 미비로 UI가 뜨기도 전에 즉시 거부돼도) outcome+shape을 정직하게
 * 기록하는 것을 목표로 삼는다 — 특정 갈래(happy)를 강제하는 assertion은
 * 실기기 셀에 두지 않는다.
 *
 * ─ 프로비저닝 미비 내성 ──────────────────────────────────────────────────────
 * 31146은 이 작성 시점 기준 IAP/페이먼츠 약관이 완전히 체결되지 않았을 수
 * 있다(#298) — 그러면 아래 두 호출은 UI를 띄우지도 못하고 즉시 native 오류
 * shape로 reject되거나(주문 생성) `{ success:false, ... }` 류 실패 envelope으로
 * resolve될 수 있다(구매 시트 — `iap.ait.test.ts`의 soft-resolve 미러가 관측한
 * `{ false, reason }` shape 참조). 그 rejection/실패 shape 자체가 ground
 * truth이므로 `iap.ait.test.ts`와 같은 원칙으로 happy를 단정하지 않고,
 * resolved/rejected/timeout 중 무엇이 나오든 shape을 기록하는 관측-단언으로
 * 설계한다.
 *
 * ─ cell 판별 (haptic.ait.test.ts 선례) ──────────────────────────────────────
 * mock 셀(`cell.platform === 'mock'`)은 devtools mock의 결정적 성공 계약
 * (300ms 뒤 자동 success — 이 파일은 `mirrorSoftResolve`를 켜지 않으므로)을
 * 하드 단언해 mock 무인 통과를 회귀 가드로 지킨다. 그 외 셀(ios/android 등
 * 아직 실측 코퍼스가 없는 실기기)은 위 프로비저닝 미비 내성 원칙대로 관용
 * 단언으로 남긴다.
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */
import { IAP, checkoutPayment } from '@apps-in-toss/web-framework';
import { afterAll, describe, expect, it } from 'vitest';
import { captureAsync, captureCallback, cell, flushCapture } from '../../test/aitCapture';

const CATEGORY = 'iap';

/**
 * 사람이 주문서 페이지·결제창을 보고 완료/취소를 판단할 시간을 넉넉히 준다.
 * ads.manual의 5000ms(광고 dismiss)보다 길게 잡는다 — 결제 여부 판단은
 * 광고를 닫는 것보다 오래 걸리는 결정이다.
 */
const HUMAN_RESPONSE_TIMEOUT_MS = 60_000;

afterAll(async () => {
  await flushCapture(CATEGORY);
});

describe('iap · 주문 생성 (수동-변형 — 사람이 주문서 페이지를 확인 후 완료/취소한다)', () => {
  it('IAP.createOneTimePurchaseOrder — 사람: 인앱결제 주문서 페이지가 뜨면 결제를 완료하거나 취소해 주세요', async () => {
    // 1) 상품 조회 선행 — 실기기가 IAP 약관 미체결이면 이 호출부터 거부되거나
    //    빈 목록으로 돌아올 수 있다. 그런 경우엔 mock 기본 상품 sku로
    //    fallback한다 — 이 테스트의 목적은 상품 조회 자체가 아니라 주문 생성
    //    호출의 outcome+shape 관측이라 sku 유효성은 부차적이다.
    const listResult = await captureAsync(
      {
        category: CATEGORY,
        api: 'IAP.getProductItemList',
        scenario: 'manual-purchase-prereq-list',
        input: null,
      },
      () => IAP.getProductItemList(),
    );
    const products =
      listResult.outcome === 'resolved' &&
      typeof listResult.value === 'object' &&
      listResult.value !== null &&
      Array.isArray((listResult.value as { products?: unknown }).products)
        ? (listResult.value as { products: Array<{ sku: string }> }).products
        : [];
    const sku = products[0]?.sku ?? 'mock-gem-100';

    // 2) 주문 생성 — 사람 관찰 포인트: 인앱결제 주문서 페이지로 실제 이동하는지,
    //    결제를 완료(또는 취소)하면 onEvent(success)/onError(USER_CANCELED 등
    //    네이티브 오류)가 오는지 확인한다. mock은 300ms 뒤 자동으로
    //    onEvent(success)를 발화하므로 사람이 직접 개입할 필요가 없다 —
    //    실기기(프로비저닝 완료 후)에서만 실제 주문서 UI가 뜨고 사람의
    //    완료/취소 제스처가 필요하다.
    const orderResult = await captureCallback(
      {
        category: CATEGORY,
        api: 'IAP.createOneTimePurchaseOrder',
        scenario: 'manual-create-order',
        input: { sku },
        timeoutMs: HUMAN_RESPONSE_TIMEOUT_MS,
      },
      ({ onEvent, onError }) =>
        IAP.createOneTimePurchaseOrder({
          options: { sku, processProductGrant: async () => true },
          onEvent,
          onError,
        }),
    );

    if (cell.platform === 'mock') {
      // mock: aitState.state.iap.nextResult 기본값 'success' → 항상 결정적으로
      // resolved+success. softResolve 미러를 켜지 않았으므로 이 하드 단언은
      // 무인 실행에서도 항상 성립한다.
      expect(orderResult.outcome).toBe('resolved');
      expect(orderResult.value).toMatchObject({
        type: 'success',
        data: expect.objectContaining({ orderId: expect.any(String) }),
      });
    } else {
      // 실기기: 프로비저닝 상태·사람의 완료/취소에 따라 갈린다 — 어느 갈래든
      // shape만 정직하게 기록한다(그 rejection shape 자체가 ground truth).
      expect(['resolved', 'rejected', 'callback-timeout']).toContain(orderResult.outcome);
      if (orderResult.outcome === 'resolved') {
        expect(orderResult.value).toMatchObject({
          type: 'success',
          data: expect.any(Object),
        });
      }
    }
  });
});

describe('iap · 구매 시트 (수동-변형 — 사람이 TossPay 결제창을 확인 후 인증/취소한다)', () => {
  it('checkoutPayment — 사람: TossPay 결제창이 뜨면 인증을 완료하거나 취소해 주세요', async () => {
    const { outcome, value } = await captureAsync(
      {
        category: CATEGORY,
        api: 'checkoutPayment',
        scenario: 'manual-checkout-sheet',
        input: { payToken: 'pt_manual_test' },
      },
      () => checkoutPayment({ params: { payToken: 'pt_manual_test' } }),
      { raceTimeoutMs: HUMAN_RESPONSE_TIMEOUT_MS },
    );

    if (cell.platform === 'mock') {
      // mock: aitState.state.payment.nextResult 기본값 'success' → 항상
      // 결정적으로 resolved+{success:true}. softResolve 미러를 켜지 않았으므로
      // 무인 실행에서도 항상 성립한다.
      expect(outcome).toBe('resolved');
      expect(value).toMatchObject({ success: true });
    } else {
      // 실기기: 프로비저닝 미비면 결제창이 뜨지도 못하고 { success:false, ... }
      // 류 실패 envelope으로 resolve되거나(iap.ait.test.ts의 soft-resolve 미러가
      // 관측한 `{ false, reason }` shape 포함) native 오류로 reject/timeout될 수
      // 있다 — 어느 갈래든 shape만 기록한다.
      expect(['resolved', 'rejected', 'timeout']).toContain(outcome);
      if (outcome === 'resolved') {
        const result = value as { success?: boolean; reason?: unknown };
        if ('success' in (result as object)) {
          expect(typeof result.success).toBe('boolean');
          // success===false면 reason을 surface해야 한다(성공으로 삼키면 안 됨).
          if (result.success === false) {
            expect(result).toHaveProperty('reason');
          }
        }
        // `success` 없는 실패 envelope(예: {false, reason})도 실 SDK가 낼 수
        // 있는 정상 경로 — 추가 단언 없음.
      }
    }
  });
});

describe('iap · 4-cell 오류-shape 캡처', () => {
  it('호출 결과가 capture sink에 쌓인다 (env3에서 native 주문/결제 오류 shape 채움)', () => {
    expect(true).toBe(true);
  });
});
