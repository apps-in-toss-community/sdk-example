import { IAP } from '@apps-in-toss/web-framework';

// Tell the app that the backend has granted the product for `orderId`.
// Returns `boolean` on success, `undefined` on older app versions (Android
// 5.233.0+, iOS 5.233.0+ required).
const granted = await IAP.completeProductGrant({ params: { orderId: 'order-123' } });
console.log('product grant completed:', granted);
