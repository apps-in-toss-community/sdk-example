import { IAP } from '@apps-in-toss/web-framework';

const info = await IAP.getSubscriptionInfo({ params: { orderId } });
