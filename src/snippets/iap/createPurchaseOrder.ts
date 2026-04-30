import { IAP } from '@apps-in-toss/web-framework';

// One-time purchase. For subscriptions, use IAP.createSubscriptionPurchaseOrder
// — same option shape.
IAP.createOneTimePurchaseOrder({
  options: {
    sku,
    processProductGrant: async () => {
      // Grant the entitlement on your backend, then return true on success.
      return true;
    },
  },
  onEvent: (event) => {
    console.log('purchase event', event);
  },
  onError: (error) => {
    console.error(error);
  },
});
