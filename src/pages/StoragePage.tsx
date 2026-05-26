import { Storage, saveBase64Data } from '@apps-in-toss/web-framework';
import { ApiCard } from '../components/ApiCard';
import { PageHeader } from '../components/PageHeader';
import { t } from '../i18n';
import { docsLink } from '../lib/docs';
import clearItemsSnippet from '../snippets/storage/clearItems.ts?raw';
import getItemSnippet from '../snippets/storage/getItem.ts?raw';
import removeItemSnippet from '../snippets/storage/removeItem.ts?raw';
import saveBase64DataSnippet from '../snippets/storage/saveBase64Data.ts?raw';
import setItemSnippet from '../snippets/storage/setItem.ts?raw';

export function StoragePage() {
  return (
    <div>
      <PageHeader title="Storage" />
      <div className="p-4 grid grid-cols-1 gap-3 sm:grid-cols-2 items-start">
        <ApiCard
          name="Storage.setItem"
          description={t('pages.storage.setItem.description')}
          params={[
            { name: 'key', label: 'Key', placeholder: 'myKey' },
            { name: 'value', label: 'Value', placeholder: 'myValue' },
          ]}
          execute={async (p) => {
            await Storage.setItem(p.key, p.value);
          }}
          snippet={setItemSnippet}
          docsUrl={docsLink('storage', 'setItem')}
        />
        <ApiCard
          name="Storage.getItem"
          description={t('pages.storage.getItem.description')}
          params={[{ name: 'key', label: 'Key', placeholder: 'myKey' }]}
          execute={(p) => Storage.getItem(p.key)}
          snippet={getItemSnippet}
          docsUrl={docsLink('storage', 'getItem')}
        />
        <ApiCard
          name="Storage.removeItem"
          description={t('pages.storage.removeItem.description')}
          params={[{ name: 'key', label: 'Key', placeholder: 'myKey' }]}
          execute={async (p) => {
            await Storage.removeItem(p.key);
          }}
          snippet={removeItemSnippet}
          docsUrl={docsLink('storage', 'removeItem')}
        />
        <ApiCard
          name="Storage.clearItems"
          description={t('pages.storage.clearItems.description')}
          params={[]}
          execute={async () => {
            await Storage.clearItems();
          }}
          snippet={clearItemsSnippet}
          docsUrl={docsLink('storage', 'clearItems')}
        />
        <ApiCard
          name="saveBase64Data"
          description={t('pages.storage.saveBase64Data.description')}
          params={[
            {
              name: 'data',
              label: 'Base64 Data',
              placeholder: 'SGVsbG8=',
              defaultValue: 'SGVsbG8=',
            },
            {
              name: 'fileName',
              label: 'File Name',
              placeholder: 'test.txt',
              defaultValue: 'test.txt',
            },
            {
              name: 'mimeType',
              label: 'MIME Type',
              placeholder: 'text/plain',
              defaultValue: 'text/plain',
            },
          ]}
          execute={async (p) => {
            await saveBase64Data({ data: p.data, fileName: p.fileName, mimeType: p.mimeType });
          }}
          snippet={saveBase64DataSnippet}
          docsUrl={docsLink('storage', 'saveBase64Data')}
        />
      </div>
    </div>
  );
}
