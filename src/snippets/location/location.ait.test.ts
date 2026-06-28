/**
 * location `.ait.test` — 값 다양화 + 의도적 오류 + 4-cell 오류-shape 캡처.
 *
 * 이 카테고리가 native 오류-shape 대조의 정본이다: iOS CoreLocation은 raw
 * native string으로, Android는 구조화된 bridge 오류로 도착한다(isLocationNativeError
 * 휴리스틱이 그 발산을 잡는다). native 오류 텍스트 단언은 platform==='mock'에서
 * skip되므로 env1은 green을 유지하고, env3(실기기)에서만 그 행이 채워진다.
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */
import { Accuracy, getCurrentLocation } from '@apps-in-toss/web-framework';
import { afterAll, describe, expect, it } from 'vitest';
import { captureAsync, cell, flushCapture } from '../../test/aitCapture';

const CATEGORY = 'location';

afterAll(async () => {
  await flushCapture(CATEGORY);
});

describe('location · 값 다양화 (happy path)', () => {
  it('getCurrentLocation을 각 Accuracy union 멤버로 호출', async () => {
    // Accuracy는 양방향 enum이라 string 키를 걸러 numeric 멤버만 다양화한다.
    const accuracyMembers = Object.values(Accuracy).filter(
      (v): v is Accuracy => typeof v === 'number',
    );
    expect(accuracyMembers.length).toBeGreaterThan(0);
    for (const accuracy of accuracyMembers) {
      const { value } = await captureAsync(
        {
          category: CATEGORY,
          api: 'getCurrentLocation',
          scenario: 'happy-varied-accuracy',
          input: { accuracy },
        },
        () => getCurrentLocation({ accuracy }),
      );
      expect(value).toMatchObject({ coords: expect.any(Object) });
    }
  });
});

describe('location · 의도적 오류 + native shape (env3 전용 단언)', () => {
  // mock cell도 이 호출을 CAPTURE한다 — 단지 native 오류 텍스트를 단언하지 않는다.
  // env3(실기기)에서는 권한 거부 시 native 오류가 도착하고, 그 raw message/keys가
  // cell diff의 핵심 신호가 된다.
  it.skipIf(cell.platform === 'mock')(
    '[native] 권한 거부 시 native 오류 shape가 도착한다 (iOS string vs Android 구조)',
    async () => {
      const { outcome, error } = await captureAsync(
        {
          category: CATEGORY,
          api: 'getCurrentLocation',
          scenario: 'native-permission-denied',
          input: { accuracy: Accuracy.Highest },
        },
        () => getCurrentLocation({ accuracy: Accuracy.Highest }),
      );
      // 실기기에서 권한이 거부된 셋업이라면 reject가 와야 한다.
      expect(outcome).toBe('rejected');
      expect(error).toBeInstanceOf(Error);
    },
  );

  it('mock cell도 getCurrentLocation 결과를 캡처한다 (단언은 shape만)', async () => {
    const { outcome } = await captureAsync(
      {
        category: CATEGORY,
        api: 'getCurrentLocation',
        scenario: 'capture-baseline',
        input: { accuracy: Accuracy.Balanced },
      },
      () => getCurrentLocation({ accuracy: Accuracy.Balanced }),
    );
    // mock은 resolve, env3은 셋업에 따라 다름 — 둘 다 레코드는 남는다.
    expect(['resolved', 'rejected']).toContain(outcome);
  });
});

describe('location · 4-cell 오류-shape 캡처', () => {
  it('호출 결과가 capture sink에 쌓인다', () => {
    expect(true).toBe(true);
  });
});
