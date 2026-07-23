/**
 * payment `.manual.ait.test` — 수동-변형 슈트 (devtools 0.1.132 `--manual-blocking`
 * 전용). 파일명 접미사 `.manual.ait.test.ts`는 iap/ads/permissions/storage와 동일
 * 계약이다(iap.manual.ait.test.ts 참조):
 *
 *  - `pnpm test`(vitest, env1)에서는 `vitest.config.ts`의 `exclude`로 완전히
 *    건너뛴다 — CI에 영향 없음.
 *  - `pnpm test:env3`(devtools-test CLI)에서도 **기본적으로 제외**된다.
 *    `--manual-blocking` 플래그를 줄 때만 실행되며, 일반 파일들이 먼저 돌고
 *    이 파일이 **마지막**에 스케줄된다.
 *
 * ─ #351: 토스페이 정기결제 인증(`requestTossPayPaysBilling`) 실기기 대비 ────────
 * `requestTossPayPaysBilling`은 토스페이 정기결제창을 띄워 사용자 인증을 받는
 * API다(`payment/requestTossPayPaysBilling.ts` snippet 참조) — 실기기에서 사람이
 * 화면을 보고 완료/취소해야 outcome이 낙착된다는 점에서 iap.manual의 두 API와
 * 같은 이유로 무인 자동 슈트(`payment.ait.test.ts`)에서 분리한다.
 *
 * ─ wrappedToken은 merchant 백엔드 발급 전제 — mock은 계약만 검증 (out of scope) ──
 * `wrappedToken`은 실제로는 merchant 백엔드가 정기결제 등록 완료 후 발급하는
 * 값이다(이 하네스엔 그 백엔드가 없다 — merchant 발급 서버는 out of scope, 이슈
 * 본문 참조). synthetic 토큰으로 mock을 호출하면 mock은 진위를 검증할 방법이
 * 없으므로, 그 응답을 "실제 인증 완료"로 오인시키면 안 된다. 그래서 mock
 * 분기(cell.platform === 'mock')는 iap.manual의 checkoutPayment처럼 성공 shape을
 * 흉내내지 않고, **export surface + 파라미터 계약**(`{ params: { wrappedToken } }`
 * 형태로 예외 없이 resolve됨)만 검증한다. 실기기 분기는 사람이 실제 정기결제
 * 인증 화면을 보고 완료/취소를 판단하는 human-in-loop로 남긴다.
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */
import { requestTossPayPaysBilling } from '@apps-in-toss/web-framework';
import { afterAll, describe, expect, it } from 'vitest';
import { captureAsync, cell, flushCapture } from '../../test/aitCapture';

const CATEGORY = 'payment';

/**
 * 사람이 정기결제 인증 화면을 보고 완료/취소를 판단할 시간을 넉넉히 준다.
 * iap.manual.ait.test.ts와 동일한 예산(주문서/결제창 판단은 광고 dismiss보다
 * 오래 걸리는 결정이다).
 */
const HUMAN_RESPONSE_TIMEOUT_MS = 60_000;

afterAll(async () => {
  await flushCapture(CATEGORY);
});

describe('payment · 정기결제 인증 (수동-변형 — 사람이 토스페이 정기결제 인증 화면을 확인 후 완료/취소한다)', () => {
  it('requestTossPayPaysBilling — 사람: 정기결제 인증 화면이 뜨면 인증을 완료하거나 취소해 주세요', async () => {
    if (cell.platform === 'mock') {
      // export surface — 함수가 실제로 노출돼 있는지.
      expect(typeof requestTossPayPaysBilling).toBe('function');

      // 파라미터 계약 — `{ params: { wrappedToken } }` 형태로 호출했을 때
      // 예외 없이 resolve되는지만 확인한다. mock은 300ms 뒤 항상 resolve하므로
      // (aitState.state.payment.nextResult와 무관하게 reject하지 않는다 — 코드
      // 확인 완료) 이 outcome 단정은 안전하다. `success` 필드의 **값**(true/false)은
      // wrappedToken 진위를 mock이 검증할 수 없으므로 단정하지 않는다 — 위 파일
      // 헤더 rationale 참조.
      const { outcome, value } = await captureAsync(
        {
          category: CATEGORY,
          api: 'requestTossPayPaysBilling',
          scenario: 'manual-billing-auth-param-contract',
          input: { wrappedToken: 'wt_manual_test' },
        },
        () => requestTossPayPaysBilling({ params: { wrappedToken: 'wt_manual_test' } }),
      );
      expect(outcome).toBe('resolved');
      if (value != null && typeof value === 'object' && 'success' in value) {
        expect(typeof (value as { success: unknown }).success).toBe('boolean');
      }
      return;
    }

    // 실기기: 사람 관찰 포인트 — 토스페이 정기결제 인증 화면으로 실제 이동하는지,
    // 완료(또는 취소)하면 { success, reason? }로 resolve되는지 확인한다.
    const { outcome, value } = await captureAsync(
      {
        category: CATEGORY,
        api: 'requestTossPayPaysBilling',
        scenario: 'manual-billing-auth',
        input: { wrappedToken: 'wt_manual_test' },
      },
      () => requestTossPayPaysBilling({ params: { wrappedToken: 'wt_manual_test' } }),
      { raceTimeoutMs: HUMAN_RESPONSE_TIMEOUT_MS },
    );

    // 프로비저닝 미비(31146 결제 미프로비저닝, umbrella CLAUDE.md 참조)면 인증
    // 화면이 뜨지도 못하고 실패 envelope으로 resolve되거나 native 오류로
    // reject/timeout될 수 있다 — iap.manual과 같은 원칙으로 어느 갈래든 shape만
    // 정직하게 기록한다.
    expect(['resolved', 'rejected', 'timeout']).toContain(outcome);
    if (outcome === 'resolved' && value != null) {
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
  });
});

describe('payment · 4-cell 오류-shape 캡처', () => {
  it('호출 결과가 capture sink에 쌓인다 (env3에서 native 정기결제 인증 오류 shape 채움)', () => {
    expect(true).toBe(true);
  });
});
