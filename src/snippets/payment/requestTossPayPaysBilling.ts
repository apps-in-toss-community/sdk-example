import { requestTossPayPaysBilling } from '@apps-in-toss/web-framework';

// 토스페이 정기결제창을 띄워 사용자 인증을 받는다. 실제 결제는 인증 성공 후
// 서버에서 별도로 처리해야 함 (success===true가 곧 결제 완료를 의미하지 않음).
const result = await requestTossPayPaysBilling({
  params: { wrappedToken: 'wt_test_xxx' },
});
console.log('billing auth:', result);
