import { requestNotificationAgreement } from '@apps-in-toss/web-framework';
import { useEffect, useRef } from 'react';
import { ApiCard } from '../components/ApiCard';
import { PageHeader } from '../components/PageHeader';
import { t } from '../i18n';
import requestNotificationAgreementSnippet from '../snippets/notification/requestNotificationAgreement.ts?raw';

export function NotificationPage() {
  const unsubRef = useRef<(() => void) | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // REAL_SDK_FINDING (devtools#806, #348): 상류 타입 선언은 cancel을 항상
      // 함수로 선언하지만, 실기기(2.x·iOS)는 object를 반환한다 — 무가드
      // `unsubRef.current?.()`는 그 경로에서 TypeError로 죽는다. typeof 가드로
      // device-safe하게 호출한다.
      if (typeof unsubRef.current === 'function') {
        unsubRef.current();
      }
    };
  }, []);

  return (
    <div>
      <PageHeader title="Notification" />
      <div className="p-4 grid grid-cols-1 gap-3 sm:grid-cols-2 items-start">
        <ApiCard
          name="requestNotificationAgreement"
          description={t('pages.notification.requestNotificationAgreement.description')}
          params={[
            {
              name: 'templateCode',
              label: 'Template Code',
              placeholder: 'NOTIF_TEMPLATE_001',
              defaultValue: 'NOTIF_TEMPLATE_001',
            },
          ]}
          execute={async (p) => {
            // Cancel any previous in-flight subscription before starting a new one
            // (typeof 가드 — 위 cleanup과 동일한 device-safe 이유).
            if (typeof unsubRef.current === 'function') {
              unsubRef.current();
            }
            unsubRef.current = null;
            return await new Promise<'newAgreement' | 'alreadyAgreed' | 'agreementRejected'>(
              (resolve, reject) => {
                unsubRef.current = requestNotificationAgreement({
                  options: { templateCode: p.templateCode },
                  onEvent: (r) => resolve(r.type),
                  onError: (e) => reject(e),
                });
              },
            );
          }}
          snippet={requestNotificationAgreementSnippet}
        />
      </div>
    </div>
  );
}
