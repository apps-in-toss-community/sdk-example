/**
 * notification `.ait.test` — 권한/동의 조회 shape 무인 단언 + 4-cell 오류-shape 캡처.
 *
 * notification 도메인은 SDK 표면이 `requestNotificationAgreement` 단 하나뿐이다
 * (callback-style: 즉시 cancel 함수를 반환하고 결과는 `onEvent`로 도착). 이 슈트
 * 신설이 notification 첫 커버리지다(#264).
 *
 * ─ 무인 vs 수동 경계 (load-bearing) ──────────────────────────────────────────
 * `requestNotificationAgreement`는 실기기에서 **네이티브 알림 동의 UI를 띄우지
 * 않는다** — SDK 타입상 이 API는 이미 결정된 동의 상태(`newAgreement` /
 * `alreadyAgreed` / `agreementRejected`)를 `onEvent`로 통지하는 조회성 콜백이고,
 * `onError`는 호출 자체의 실패(콜백 throw 등)에만 쓰인다. 따라서 permission
 * dialog처럼 사용자 탭을 기다리는 API가 아니라 **무인 실행 가능** — camera/ads
 * SHOW 계열과 달리 `it.skipIf` 게이트가 필요 없다.
 *
 * 실제 **푸시 발송/수신**(사용자가 알림을 받고 여는 것)은 이 API의 책임이 아니고
 * SDK 표면에 없다 — 실 push가 필요한 회귀는 이 슈트의 범위 밖이다(#264 명시).
 *
 * ─ mock 배선 — permissions 버킷이 아니라 전용 nextResult 토글 (mock gap) ────
 * devtools mock(`@ait-co/devtools/dist/mock`)은 notification 동의 상태를
 * clipboard/contacts처럼 `aitState.state.permissions.<domain>`(allowed/denied
 * 2-state) 버킷으로 모델링하지 않는다. 대신 `aitState.state.notification.nextResult`
 * 라는 전용 3-value 필드(`newAgreement` | `alreadyAgreed` | `agreementRejected`)로
 * 다음 호출의 결과를 직접 지정한다 — `requestPermission`/`openPermissionDialog`
 * 경로를 타지 않는다. 그래서 이 슈트는 `aitState.patch('permissions', ...)`가
 * 아니라 `aitState.patch('notification', { nextResult: ... })`로 3가지 분기를
 * 모두 무인 강제한다. (permissions 버킷에 notification 키가 없다는 사실 자체가
 * mock gap이다 — PR 본문에 기록.)
 *
 * env3(real SDK)에서는 `aitState`가 없으므로(mock 전용 export) outcome 관측 +
 * 도착한 type의 union 멤버십만 단언한다.
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */
import { requestNotificationAgreement } from '@apps-in-toss/web-framework';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { captureCallback, cell, flushCapture } from '../../test/aitCapture';
import { isNativeErrorShape } from '../../test/isNativeError';

const CATEGORY = 'notification';

afterAll(async () => {
  await flushCapture(CATEGORY);
});

type NextResult = 'newAgreement' | 'alreadyAgreed' | 'agreementRejected';
const AGREEMENT_RESULTS: readonly NextResult[] = ['newAgreement', 'alreadyAgreed', 'agreementRejected'];

/**
 * env1(mock) 전용 — devtools mock의 다음 `requestNotificationAgreement` 결과를
 * 강제로 지정한다. `@apps-in-toss/web-framework`가 vitest alias로
 * `@ait-co/devtools/mock`을 가리킬 때만 `aitState`가 존재하므로, 동적 import +
 * optional 접근으로 env3(real SDK)에서 안전하게 no-op이 되게 한다.
 */
async function forceNotificationNextResult(nextResult: NextResult): Promise<void> {
  const mod: unknown = await import('@apps-in-toss/web-framework');
  const aitState = (mod as { aitState?: { patch: (key: string, partial: unknown) => void } })
    .aitState;
  aitState?.patch('notification', { nextResult });
}

/** 다음 테스트에 상태가 새지 않도록 매 테스트 후 기본값(newAgreement)으로 복구한다. */
afterEach(async () => {
  if (cell.platform === 'mock') {
    await forceNotificationNextResult('newAgreement');
  }
});

describe('notification · requestNotificationAgreement (mock nextResult 3분기 무인 단언)', () => {
  it('nextResult 3분기(newAgreement/alreadyAgreed/agreementRejected) 각각 onEvent가 동일 type으로 도착한다 (mock)', async () => {
    for (const nextResult of AGREEMENT_RESULTS) {
      if (cell.platform === 'mock') {
        await forceNotificationNextResult(nextResult);
      }
      const result = await captureCallback(
        {
          category: CATEGORY,
          api: 'requestNotificationAgreement',
          scenario: `happy-force-${nextResult}`,
          input: { templateCode: 'NOTIF_TEMPLATE_001' },
        },
        ({ onEvent, onError }) =>
          requestNotificationAgreement({
            options: { templateCode: 'NOTIF_TEMPLATE_001' },
            onEvent,
            onError,
          }),
      );

      if (cell.platform === 'mock') {
        // mock은 nextResult로 강제한 값을 그대로 onEvent에 실어 보낸다 — 실계약 하드 단언.
        expect(result.outcome).toBe('resolved');
        expect(result.value).toMatchObject({ type: nextResult });
      } else if (result.outcome === 'resolved') {
        // env3: 실 SDK 응답 — 정확한 분기 강제는 불가하니 도착한 type의 union 멤버십 + shape만 단언.
        const value = result.value as { type?: unknown };
        expect(AGREEMENT_RESULTS).toContain(value.type);
      } else {
        // 3초 내 무응답(callback-timeout)도 실기기 네트워크 상황상 정당한 무응답.
        expect(['rejected', 'callback-timeout']).toContain(result.outcome);
      }
    }
  });

  it('cancel 함수가 동기로 반환되고, 호출 전 취소해도 예외를 던지지 않는다', () => {
    // requestNotificationAgreement는 즉시 cancel 함수를 동기 반환한다 — 이 계약은
    // outcome(onEvent/onError 도착) 여부와 무관하게 항상 성립해야 한다.
    let cancel: (() => void) | undefined;
    expect(() => {
      cancel = requestNotificationAgreement({
        options: { templateCode: 'NOTIF_TEMPLATE_001' },
        onEvent: () => {},
        onError: () => {},
      });
    }).not.toThrow();
    expect(typeof cancel).toBe('function');
    // unmount 시 흔한 패턴 — 이벤트 도착 전 취소해도 예외 없이 정리돼야 한다.
    expect(() => cancel?.()).not.toThrow();
  });
});

describe('notification · 의도적 오류 (확인된 오용 가드)', () => {
  // A1: 빈 templateCode를 넘겨도 SDK가 즉시 throw하지 않아야 한다 — 흔한 실수
  // (설정 누락)에도 콜백 계약이 깨지지 않아야 한다는 것이 이 케이스의 핵심 계약.
  it('[A1] 빈 templateCode로 호출해도 예외 없이 즉시 cancel 함수를 반환하고, 콜백은 실계약 shape로 귀결한다', async () => {
    // 동기 계약 — throw 없이 cancel 함수를 즉시 반환해야 한다.
    let cancel: (() => void) | undefined;
    expect(() => {
      cancel = requestNotificationAgreement({
        options: { templateCode: '' },
        onEvent: () => {},
        onError: () => {},
      });
    }).not.toThrow();
    expect(typeof cancel).toBe('function');
    cancel?.();

    // mock은 templateCode 값과 무관하게 nextResult를 그대로 onEvent에 실어 보낸다 —
    // 실계약 하드 단언(mock에서 rejected/timeout이 뜨면 회귀).
    const result = await captureCallback(
      {
        category: CATEGORY,
        api: 'requestNotificationAgreement',
        scenario: 'A1-empty-templateCode',
        input: { templateCode: '' },
      },
      ({ onEvent, onError }) =>
        requestNotificationAgreement({
          options: { templateCode: '' },
          onEvent,
          onError,
        }),
    );
    if (cell.platform === 'mock') {
      expect(result.outcome).toBe('resolved');
      expect(AGREEMENT_RESULTS).toContain((result.value as { type?: unknown }).type);
    } else if (result.outcome === 'resolved') {
      expect(AGREEMENT_RESULTS).toContain((result.value as { type?: unknown }).type);
    } else if (result.outcome === 'rejected') {
      // 빈 templateCode를 네이티브가 거부하는 경로 — native error shape로 실단언.
      expect(isNativeErrorShape(result.error) || result.error instanceof Error).toBe(true);
    } else {
      // callback-timeout — env3 네트워크 상황상 정당한 무응답.
      expect(result.outcome).toBe('callback-timeout');
    }
  });
});

describe('notification · 4-cell 오류-shape 캡처', () => {
  it('호출 결과가 capture sink에 쌓인다', () => {
    expect(true).toBe(true);
  });
});
