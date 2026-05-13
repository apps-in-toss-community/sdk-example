import { requestTossPayPaysBilling } from '@apps-in-toss/web-framework';
import { ApiCard } from '../components/ApiCard';
import { PageHeader } from '../components/PageHeader';
import { t } from '../i18n';
import requestTossPayPaysBillingSnippet from '../snippets/payment/requestTossPayPaysBilling.ts?raw';

export function PaymentPage() {
  return (
    <div>
      <PageHeader title="Payment" />
      <div className="p-4 space-y-3">
        <ApiCard
          name="requestTossPayPaysBilling"
          description={t('pages.payment.requestTossPayPaysBilling.description')}
          params={[
            {
              name: 'wrappedToken',
              label: 'Wrapped Token',
              placeholder: 'wt_test_xxx',
              defaultValue: 'wt_test_xxx',
            },
          ]}
          execute={(p) => requestTossPayPaysBilling({ params: { wrappedToken: p.wrappedToken } })}
          snippet={requestTossPayPaysBillingSnippet}
        />
      </div>
    </div>
  );
}
