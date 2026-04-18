import { getClipboardText, setClipboardText } from '@apps-in-toss/web-framework';
import { ApiCard } from '../components/ApiCard';
import { PageHeader } from '../components/PageHeader';

export function ClipboardPage() {
  return (
    <div>
      <PageHeader title="Clipboard" />
      <div className="p-4 space-y-3">
        <ApiCard
          name="setClipboardText"
          description="클립보드에 텍스트 복사"
          params={[{ name: 'text', label: 'Text', placeholder: '복사할 텍스트' }]}
          execute={async (p) => {
            await setClipboardText(p.text);
          }}
        />
        <ApiCard
          name="getClipboardText"
          description="클립보드 텍스트 읽기"
          params={[]}
          execute={async () => await getClipboardText()}
        />
      </div>
    </div>
  );
}
