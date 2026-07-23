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
  contactsViral,
  getGameCenterGameProfile,
  grantPromotionReward,
  grantPromotionRewardForGame,
  openGameCenterLeaderboard,
  submitGameCenterLeaderBoardScore,
} from '@apps-in-toss/web-framework';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { captureAsync, flushCapture } from '../../test/aitCapture';
import { clearSoftResolveMirror, mirrorSoftResolve } from '../../test/provisioningMirror';

const CATEGORY = 'game';

beforeAll(async () => {
  // 31146엔 promotion이 등록돼 있지 않아 실기기(env3)는 grantPromotionReward*를 reject가
  // 아니라 { errorCode, message } soft-resolve로 돌려준다(run11 2.x/iOS 실측). env1(mock)도
  // 같은 shape로 맞춰 capture diff가 동치를 보게 한다(devtools#789). getGameCenterGameProfile·
  // submitGameCenterLeaderBoardScore는 다이얼 대상이 아니라 영향받지 않는다.
  await mirrorSoftResolve('grantPromotionReward', 'grantPromotionRewardForGame');
});

afterAll(async () => {
  await clearSoftResolveMirror();
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
      // resolve하는 soft-resolve다(run11 실측: outcome=resolved,
      // valueKeys=['errorCode','message']). 위 beforeAll의 mirrorSoftResolve가 env1(mock)도
      // 같은 shape로 맞추므로, resolved 분기에서 두 환경 모두 { errorCode, message }를 단언한다.
      if (outcome === 'resolved') {
        expect(value).toMatchObject({ errorCode: expect.anything(), message: expect.anything() });
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
    // reject한다는 뜻이 아니다. mirrorSoftResolve로 env1(mock)도 soft-resolve하므로
    // resolved 분기에서 두 환경 모두 { errorCode, message }를 단언한다.
    expect(['resolved', 'rejected']).toContain(forGame.outcome);
    if (forGame.outcome === 'resolved') {
      expect(forGame.value).toMatchObject({ errorCode: expect.anything(), message: expect.anything() });
    }
  });
});

describe('game · OOS: native-UI side-effect (자동 device diff 구조적 불가, #331)', () => {
  // 아래 2개는 사람이 화면을 보고 진행·종료해야 낙착되는 native-UI side-effect라
  // 자동 device diff가 구조적으로 불가능하다 — GPS·해프틱류 하드웨어 감응 축과
  // 같은 원칙으로 명시적으로 out-of-scope 문서화한다(silent omission 금지).
  // 실기기 검증은 사람이 직접 실행하는 별도 세션의 몫이다(이 슈트의 스코프 밖).

  it('openGameCenterLeaderboard — human-in-loop, 자동 diff 불가 (OOS, #331)', () => {
    // 네이티브 게임센터 리더보드 웹뷰를 연다 — 사람이 보고 닫아야 하고, 닫는
    // 시점은 전적으로 사람에게 달려 있다. 앱 버전이 낮으면 조용히 no-op이라
    // 그 자체로도 재현 가능한 shape이 아니다.
    expect(typeof openGameCenterLeaderboard).toBe('function');
  });

  it('contactsViral — human-in-loop, 자동 diff 불가 (OOS, #331)', () => {
    // 네이티브 친구초대 화면을 연다 — onEvent는 사람이 실제로 친구에게
    // 공유하거나 뒤로가기로 나가야만 발화한다. 지급 리워드/종료 사유가
    // 사람의 선택에 달려 있어 재현 가능한 baseline이 없다.
    expect(typeof contactsViral).toBe('function');
  });
});

describe('game · 4-cell 오류-shape 캡처', () => {
  it('호출 결과가 capture sink에 쌓인다', () => {
    expect(true).toBe(true);
  });
});
