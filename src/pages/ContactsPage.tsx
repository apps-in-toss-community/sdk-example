import { PageHeader } from '../components/PageHeader';
import { ApiCard } from '../components/ApiCard';
import { fetchContacts } from '@apps-in-toss/web-framework';

export function ContactsPage() {
  return (
    <div>
      <PageHeader title="Contacts" />
      <div className="p-4 space-y-3">
        <ApiCard
          name="fetchContacts"
          description="연락처 가져오기"
          params={[
            { name: 'size', label: 'Size', type: 'number', defaultValue: '10', parse: (v) => Number(v) },
            { name: 'offset', label: 'Offset', type: 'number', defaultValue: '0', parse: (v) => Number(v) },
          ]}
          execute={async (p) => await fetchContacts({ size: p.size as number, offset: p.offset as number })}
        />
      </div>
    </div>
  );
}
