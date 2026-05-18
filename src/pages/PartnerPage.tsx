import { partner } from '@apps-in-toss/web-framework';
import { ApiCard } from '../components/ApiCard';
import { PageHeader } from '../components/PageHeader';
import { t } from '../i18n';
import addAccessoryButtonSnippet from '../snippets/partner/addAccessoryButton.ts?raw';
import removeAccessoryButtonSnippet from '../snippets/partner/removeAccessoryButton.ts?raw';

export function PartnerPage() {
  return (
    <div>
      <PageHeader title="Partner" />
      <div className="p-4 space-y-3">
        <ApiCard
          name="partner.addAccessoryButton"
          description={t('pages.partner.addAccessoryButton.description')}
          params={[
            { name: 'id', label: 'Button ID', placeholder: 'btn-1', defaultValue: 'btn-1' },
            { name: 'title', label: 'Title', placeholder: '하트', defaultValue: '하트' },
            {
              name: 'iconName',
              label: 'TDS Icon Name',
              placeholder: 'icon-heart-mono',
              defaultValue: 'icon-heart-mono',
            },
          ]}
          execute={async (p) => {
            await partner.addAccessoryButton({
              id: p.id,
              title: p.title,
              icon: { name: p.iconName },
            });
          }}
          snippet={addAccessoryButtonSnippet}
        />
        <ApiCard
          name="partner.removeAccessoryButton"
          description={t('pages.partner.removeAccessoryButton.description')}
          params={[]}
          execute={async () => {
            await partner.removeAccessoryButton();
          }}
          snippet={removeAccessoryButtonSnippet}
        />
      </div>
    </div>
  );
}
