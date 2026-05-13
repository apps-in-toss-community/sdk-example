import { requestNotificationAgreement } from '@apps-in-toss/web-framework';
import { ApiCard } from '../components/ApiCard';
import { PageHeader } from '../components/PageHeader';
import { t } from '../i18n';
import requestNotificationAgreementSnippet from '../snippets/notification/requestNotificationAgreement.ts?raw';

export function NotificationPage() {
  return (
    <div>
      <PageHeader title="Notification" />
      <div className="p-4 space-y-3">
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
            return await new Promise<'newAgreement' | 'alreadyAgreed' | 'agreementRejected'>(
              (resolve, reject) => {
                requestNotificationAgreement({
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
