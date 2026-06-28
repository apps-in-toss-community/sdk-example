import { IAP } from '@apps-in-toss/web-framework';

// One-time purchase. For subscriptions, use IAP.createSubscriptionPurchaseOrder
// — same option shape.
//
// createOneTimePurchaseOrder는 구독(이벤트 리스너)을 반환합니다.
// 반환된 cleanup 함수를 호출하지 않으면 리스너가 계속 남아 메모리 누수가 발생합니다.
const cleanup = IAP.createOneTimePurchaseOrder({
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

// 구매 흐름이 끝나면(성공·실패·화면 이탈 등) 반드시 cleanup을 호출해 리스너를 해제합니다.
// React를 사용한다면 useEffect 반환값으로 등록하세요:
//   useEffect(() => {
//     const cleanup = IAP.createOneTimePurchaseOrder({ … });
//     return cleanup;
//   }, []);
cleanup();
