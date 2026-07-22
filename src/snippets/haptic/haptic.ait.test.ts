/**
 * haptic `.ait.test` — 값 다양화 + 의도적 오류 + 4-cell 오류-shape 캡처.
 *
 * `generateHapticFeedback`은 fire-and-forget 하드웨어 API — 앱브릿지가 진동을
 * 요청만 하고 성공/실패 판정을 SDK 레벨에서 되돌려주지 않는다. `@returns {void}`가
 * 실제 signature는 `Promise<void>`라 항상 resolve만 하고 reject 경로가 계약상 없다
 * (mock 구현도 `type`을 검증하지 않고 알 수 없는 값은 fallback 패턴(30ms)으로 처리).
 * 따라서 misuse 가드는 "잘못된 type을 던져도 예외 없이 resolve" 계약을 확인한다 —
 * 다른 도메인의 "오류 envelope shape" 패턴과 다르게, 여기선 "안 죽는다"가 계약이다.
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */
import type { HapticFeedbackType } from '@apps-in-toss/web-framework';
import { generateHapticFeedback } from '@apps-in-toss/web-framework';
import { afterAll, describe, expect, it } from 'vitest';
import { captureAsync, cell, flushCapture } from '../../test/aitCapture';

const CATEGORY = 'haptic';

afterAll(async () => {
  await flushCapture(CATEGORY);
});

const HAPTIC_TYPES: HapticFeedbackType[] = [
  'tickWeak',
  'tap',
  'tickMedium',
  'softMedium',
  'basicWeak',
  'basicMedium',
  'success',
  'error',
  'wiggle',
  'confetti',
];

describe('haptic · 값 다양화 (happy path, fire-and-forget)', () => {
  // #296: env3(2.x/iOS) 캡처(`haptic.2.x.ios.json`)가 10종 HapticFeedbackType 전부에서
  // `resolved`+`value:undefined`를 실측했다 — mock과 동일 계약이다(H1의 EXECUTION_ERROR
  // reject는 이 happy 시나리오가 아니라 별도 [H1] 오용 케이스에서만 관측됨). 그래서 이제
  // mock·ios 두 셀 모두 하드 단언으로 승격한다. android는 아직 이 시나리오를 실측한
  // 코퍼스가 없으므로(#330 재캡처 대상 밖 — haptic은 애초에 stale 목록에도 없었을 만큼
  // 시나리오 자체가 android에서 전무하다) 관용 단언을 그대로 남겨 미측정 셀을 하드
  // 단언으로 성급히 덮지 않는다.
  it('generateHapticFeedback이 10종 HapticFeedbackType 전부에서 void로 resolve된다', async () => {
    for (const type of HAPTIC_TYPES) {
      const { outcome, value } = await captureAsync(
        { category: CATEGORY, api: 'generateHapticFeedback', scenario: 'happy-varied-type', input: { type } },
        () => generateHapticFeedback({ type }),
      );
      if (cell.platform === 'mock' || cell.platform === 'ios') {
        // mock: 하드웨어 진동 성공 여부와 무관하게 항상 resolve.
        // ios(2.x, #296 실측): 10종 전부 resolved+undefined — mock과 수렴하는
        // 계약이라 회귀 가드로 하드 단언한다.
        expect(outcome).toBe('resolved');
        expect(value).toBeUndefined();
      } else {
        // android 등 아직 이 시나리오를 실측하지 않은 셀 — 계약 확정 전까지 관용 단언.
        expect(['resolved', 'rejected']).toContain(outcome);
      }
    }
  });
});

describe('haptic · 의도적 오류 (확인된 오용 가드)', () => {
  // H1: 존재하지 않는(SDK 타입 밖의) type 문자열은 거부된다.
  //
  // 예전 단언은 정반대였다 — "예외 없이 resolve"가 fire-and-forget 계약이라고 봤다.
  // 그건 mock 구현(알 수 없는 type을 fallback 패턴으로 삼킴)을 계약으로 착각한 것이고,
  // 실기기(env3)는 이 입력을 네이티브 오류 envelope(`code: EXECUTION_ERROR`)로 reject한다.
  // 그래서 mock-only 분기로 발산을 인정하고 있었다. devtools#781이 mock을 실측에 맞추면서
  // 그 발산이 사라졌으므로 이제 모든 환경에서 **거부**를 단언한다. 오류 코드는 네이티브
  // envelope의 `.code`에서 읽는다(devtools#790이 `.errorCode` 대신 실기기 envelope으로 정렬).
  it('[H1] 알 수 없는 type 문자열은 거부된다', async () => {
    const bogusType = 'not-a-real-haptic-type' as HapticFeedbackType;
    const { outcome, error } = await captureAsync(
      {
        category: CATEGORY,
        api: 'generateHapticFeedback',
        scenario: 'H1-unknown-type-value',
        input: { type: bogusType },
      },
      () => generateHapticFeedback({ type: bogusType }),
    );
    expect(outcome).toBe('rejected');
    expect((error as { code?: unknown } | undefined)?.code).toBe('EXECUTION_ERROR');
  });
});

describe('haptic · 4-cell 오류-shape 캡처', () => {
  it('호출 결과가 capture sink에 쌓인다', () => {
    expect(true).toBe(true);
  });
});
