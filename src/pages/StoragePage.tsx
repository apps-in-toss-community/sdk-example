import { PageHeader } from '../components/PageHeader';
import { ApiCard } from '../components/ApiCard';
import { Storage } from '@apps-in-toss/web-framework';

export function StoragePage() {
  return (
    <div>
      <PageHeader title="Storage" />
      <div className="p-4 space-y-3">
        <ApiCard
          name="Storage.setItem"
          description="값 저장"
          params={[
            { name: 'key', label: 'Key', placeholder: 'myKey' },
            { name: 'value', label: 'Value', placeholder: 'myValue' },
          ]}
          execute={async (p) => { await Storage.setItem(p.key as string, p.value as string); }}
        />
        <ApiCard
          name="Storage.getItem"
          description="값 조회"
          params={[{ name: 'key', label: 'Key', placeholder: 'myKey' }]}
          execute={async (p) => await Storage.getItem(p.key as string)}
        />
        <ApiCard
          name="Storage.removeItem"
          description="값 삭제"
          params={[{ name: 'key', label: 'Key', placeholder: 'myKey' }]}
          execute={async (p) => { await Storage.removeItem(p.key as string); }}
        />
        <ApiCard
          name="Storage.clearItems"
          description="전체 삭제"
          execute={async () => { await Storage.clearItems(); }}
        />
      </div>
    </div>
  );
}
