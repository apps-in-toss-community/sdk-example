import { grantPromotionReward } from '@apps-in-toss/web-framework';

// grantPromotionRewardForGame()은 deprecated — grantPromotionReward()을 사용하세요.
const result = await grantPromotionReward({
  params: { promotionCode, amount },
});
