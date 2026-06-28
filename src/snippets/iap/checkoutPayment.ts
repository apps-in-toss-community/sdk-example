import { checkoutPayment } from '@apps-in-toss/web-framework';

// checkoutPayment는 실패해도 reject하지 않고 { success, reason }을 반환합니다.
// result.success를 확인하지 않으면 인증 실패를 성공으로 잘못 처리할 수 있습니다.
const result = await checkoutPayment({ params: { payToken } });

if (result.success) {
  // 인증 성공 — 서버에서 실제 결제를 처리합니다.
  console.log('결제 인증 성공');
} else {
  // 인증 실패 — result.reason에 실패 사유가 담길 수 있습니다.
  console.log('결제 인증 실패:', result.reason);
}
