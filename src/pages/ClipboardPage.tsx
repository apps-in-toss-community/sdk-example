import { getClipboardText, setClipboardText } from '@apps-in-toss/web-framework';
import { ApiCard } from '../components/ApiCard';
import { PageHeader } from '../components/PageHeader';
import { PolyfillNotice } from '../components/PolyfillNotice';
import { docsLink } from '../lib/docs';
import clipboardReadTextSnippet from '../snippets/clipboard/clipboardReadText.ts?raw';
import clipboardWriteTextSnippet from '../snippets/clipboard/clipboardWriteText.ts?raw';
import getClipboardTextSnippet from '../snippets/clipboard/getClipboardText.ts?raw';
import setClipboardTextSnippet from '../snippets/clipboard/setClipboardText.ts?raw';

export function ClipboardPage() {
  return (
    <div>
      <PageHeader title="Clipboard" />
      <div className="p-4 space-y-3">
        <PolyfillNotice webApis="navigator.clipboard.readText / writeText" />

        <ApiCard
          name="setClipboardText"
          description="SDK — 클립보드에 텍스트 복사"
          params={[{ name: 'text', label: 'Text', placeholder: '복사할 텍스트' }]}
          execute={async (p) => {
            await setClipboardText(p.text);
          }}
          snippet={setClipboardTextSnippet}
          docsUrl={docsLink('clipboard', 'setClipboardText')}
        />
        <ApiCard
          name="getClipboardText"
          description="SDK — 클립보드 텍스트 읽기"
          params={[]}
          execute={() => getClipboardText()}
          snippet={getClipboardTextSnippet}
          docsUrl={docsLink('clipboard', 'getClipboardText')}
        />

        <ApiCard
          name="navigator.clipboard.writeText"
          description="표준 Web API (via @ait-co/polyfill)"
          params={[{ name: 'text', label: 'Text', placeholder: '복사할 텍스트' }]}
          execute={async (p) => {
            await navigator.clipboard.writeText(p.text);
          }}
          snippet={clipboardWriteTextSnippet}
        />
        <ApiCard
          name="navigator.clipboard.readText"
          description="표준 Web API (via @ait-co/polyfill)"
          params={[]}
          execute={() => navigator.clipboard.readText()}
          snippet={clipboardReadTextSnippet}
        />
      </div>
    </div>
  );
}
