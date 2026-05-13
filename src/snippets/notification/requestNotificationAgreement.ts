import { requestNotificationAgreement } from '@apps-in-toss/web-framework';

// 푸시 알림 동의 UI를 띄운다. callback-style API: 결과는 onEvent로 도착하고,
// 즉시 반환되는 cancel 함수로 unmount 등에서 취소 가능.
const cancel = requestNotificationAgreement({
  options: { templateCode: 'NOTIF_TEMPLATE_001' },
  onEvent: (result) => {
    // result.type: 'newAgreement' | 'alreadyAgreed' | 'agreementRejected'
    console.log('notification agreement:', result.type);
  },
  onError: (err) => {
    console.error('notification agreement failed:', err);
  },
});

// 컴포넌트 unmount 시:
// cancel();
