import { Storage } from '@apps-in-toss/web-framework';
import { ApiCard } from '../components/ApiCard';
import { PageHeader } from '../components/PageHeader';
import clearItemsSnippet from '../snippets/storage/clearItems.ts?raw';
import getItemSnippet from '../snippets/storage/getItem.ts?raw';
import removeItemSnippet from '../snippets/storage/removeItem.ts?raw';
import setItemSnippet from '../snippets/storage/setItem.ts?raw';

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
          execute={async (p) => {
            await Storage.setItem(p.key, p.value);
          }}
          snippet={setItemSnippet}
        />
        <ApiCard
          name="Storage.getItem"
          description="값 조회"
          params={[{ name: 'key', label: 'Key', placeholder: 'myKey' }]}
          execute={async (p) => await Storage.getItem(p.key)}
          snippet={getItemSnippet}
        />
        <ApiCard
          name="Storage.removeItem"
          description="값 삭제"
          params={[{ name: 'key', label: 'Key', placeholder: 'myKey' }]}
          execute={async (p) => {
            await Storage.removeItem(p.key);
          }}
          snippet={removeItemSnippet}
        />
        <ApiCard
          name="Storage.clearItems"
          description="전체 삭제"
          params={[]}
          execute={async () => {
            await Storage.clearItems();
          }}
          snippet={clearItemsSnippet}
        />
      </div>
    </div>
  );
}
