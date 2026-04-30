import { grantPromotionRewardForGame } from '@apps-in-toss/web-framework';

const result = await grantPromotionRewardForGame({
  params: { promotionCode, amount },
});
