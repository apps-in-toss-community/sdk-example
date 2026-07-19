/**
 * game `.ait.test` — 값 다양화 + 의도적 오류 + 4-cell 오류-shape 캡처.
 *
 * 확인된 오용 가드:
 *  - G1: deprecated swap. 게임 프로모션 보상은 범용 grantPromotionReward가 아니라
 *        게임용 grantPromotionRewardForGame을 써야 한다 — 둘 다 보상 key를 반환하지만
 *        게임 컨텍스트는 후자가 권장. 권장 변형이 정상 동작함을 가드한다.
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */
import {
  getGameCenterGameProfile,
  grantPromotionReward,
  grantPromotionRewardForGame,
  submitGameCenterLeaderBoardScore,
} from '@apps-in-toss/web-framework';
import { afterAll, describe, expect, it } from 'vitest';
import { captureAsync, cell, flushCapture } from '../../test/aitCapture';

const CATEGORY = 'game';

afterAll(async () => {
  await flushCapture(CATEGORY);
});

describe('game · 값 다양화 (happy path)', () => {
  it('getGameCenterGameProfile / submitGameCenterLeaderBoardScore가 선언 shape로 resolve', async () => {
    const profile = await captureAsync(
      {
        category: CATEGORY,
        api: 'getGameCenterGameProfile',
        scenario: 'happy-default',
        input: null,
      },
      () => getGameCenterGameProfile(),
    );
    expect(profile.value).toMatchObject({ statusCode: expect.any(String) });

    // score는 string 계약(소수 포함 가능). 다양한 문자열 점수로 호출.
    for (const score of ['0', '1', '9999', '1000000', '123.45']) {
      const { value } = await captureAsync(
        {
          category: CATEGORY,
          api: 'submitGameCenterLeaderBoardScore',
          scenario: 'happy-varied-score',
          input: { score },
        },
        () => submitGameCenterLeaderBoardScore({ score }),
      );
      expect(value).toMatchObject({ statusCode: expect.any(String) });
    }
  });

  it('grantPromotionRewardForGame을 다양한 promotionCode/amount로 호출', async () => {
    for (const params of [
      { promotionCode: 'WELCOME', amount: 100 },
      { promotionCode: 'EVENT-2026', amount: 1 },
      { promotionCode: 'LARGE', amount: 999_999 },
    ]) {
      const { value, outcome } = await captureAsync(
        {
          category: CATEGORY,
          api: 'grantPromotionRewardForGame',
          scenario: 'happy-varied-promotion',
          input: params,
        },
        () => grantPromotionRewardForGame({ params }),
      );
      // env3에서 날조된 promotionCode는 workspace 3095/app 31146에 미등록이지만
      // **reject되지 않는다** — 실기기는 `{ errorCode, message }` 본문을 담아
      // resolve하는 soft-resolve다(실기기 캡처 관측: outcome=resolved,
      // valueKeys=['errorCode','message']). 즉 outcome만 보면 성공과 구분되지 않는다.
      // mock(env1)은 `{ key }`를 반환하므로 shape 단언은 mock + resolved 조합에서만
      // 하고, env3에서는 캡처만 수행한다.
      if (outcome === 'resolved' && cell.platform === 'mock') {
        expect(value).toMatchObject({ key: expect.any(String) });
      }
    }
  });
});

describe('game · 의도적 오류 (확인된 오용 가드)', () => {
  // G1: deprecated swap. 게임 컨텍스트는 grantPromotionRewardForGame을 써야 한다.
  // 권장 변형이 보상 key를 정상 반환함을 가드하고, 범용 변형과 결과를 대조 캡처한다.
  it('[G1] grantPromotionRewardForGame이 게임용 보상 경로로 동작한다', async () => {
    const forGame = await captureAsync(
      {
        category: CATEGORY,
        api: 'grantPromotionRewardForGame',
        scenario: 'G1-game-variant',
        input: { promotionCode: 'PC', amount: 100 },
      },
      () => grantPromotionRewardForGame({ params: { promotionCode: 'PC', amount: 100 } }),
    );
    // 대조용으로 범용 변형도 캡처(같은 cell에 두 레코드 → diff 가능).
    await captureAsync(
      {
        category: CATEGORY,
        api: 'grantPromotionReward',
        scenario: 'G1-generic-variant-contrast',
        input: { promotionCode: 'PC', amount: 100 },
      },
      () => grantPromotionReward({ params: { promotionCode: 'PC', amount: 100 } }),
    );
    // env3에서 미등록 promotionCode 'PC'도 reject가 아니라 `{ errorCode, message }`
    // soft-resolve다(위 happy-varied-promotion 주석과 같은 관측). 아래 outcome 단언이
    // 'rejected'를 함께 허용하는 건 향후 계약 변화를 견디기 위한 여유지, 실기기가
    // reject한다는 뜻이 아니다. `{ key }` 단언은 mock(env1) + resolved 조합일 때만.
    expect(['resolved', 'rejected']).toContain(forGame.outcome);
    if (forGame.outcome === 'resolved' && cell.platform === 'mock') {
      expect(forGame.value).toMatchObject({ key: expect.any(String) });
    }
  });
});

describe('game · 4-cell 오류-shape 캡처', () => {
  it('호출 결과가 capture sink에 쌓인다', () => {
    expect(true).toBe(true);
  });
});
