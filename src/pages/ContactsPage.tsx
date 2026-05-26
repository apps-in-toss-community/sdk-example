import { fetchContacts } from '@apps-in-toss/web-framework';
import { ApiCard } from '../components/ApiCard';
import { PageHeader } from '../components/PageHeader';
import { t } from '../i18n';
import fetchContactsSnippet from '../snippets/contacts/fetchContacts.ts?raw';

export function ContactsPage() {
  return (
    <div>
      <PageHeader title="Contacts" />
      <div className="p-4 grid grid-cols-1 gap-3 sm:grid-cols-2 items-start">
        <ApiCard
          name="fetchContacts"
          description={t('pages.contacts.fetchContacts.description')}
          params={[
            {
              name: 'size',
              label: 'Size',
              type: 'number',
              defaultValue: '10',
              parse: (v) => Number(v),
            },
            {
              name: 'offset',
              label: 'Offset',
              type: 'number',
              defaultValue: '0',
              parse: (v) => Number(v),
            },
          ]}
          execute={(p) => fetchContacts({ size: p.size, offset: p.offset })}
          snippet={fetchContactsSnippet}
        />
      </div>
    </div>
  );
}
