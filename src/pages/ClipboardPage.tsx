import { getClipboardText, setClipboardText } from '@apps-in-toss/web-framework';
import { PageHeader } from '../components/PageHeader';
import { PolyfillNotice } from '../components/PolyfillNotice';
import { PolyfillToggleCard } from '../components/PolyfillToggleCard';
import { t } from '../i18n';
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

        <PolyfillToggleCard
          title={t('pages.clipboard.writeText.title')}
          sdk={{
            name: 'setClipboardText',
            description: t('pages.clipboard.setClipboardText.description'),
            params: [{ name: 'text', label: 'Text', placeholder: '복사할 텍스트' }],
            execute: async (p) => {
              await setClipboardText(p.text);
            },
            snippet: setClipboardTextSnippet,
            docsUrl: docsLink('clipboard', 'setClipboardText'),
          }}
          polyfill={{
            name: 'navigator.clipboard.writeText',
            description: t('pages.clipboard.navigatorWriteText.description'),
            params: [{ name: 'text', label: 'Text', placeholder: '복사할 텍스트' }],
            execute: async (p) => {
              await navigator.clipboard.writeText(p.text);
            },
            snippet: clipboardWriteTextSnippet,
          }}
        />

        <PolyfillToggleCard
          title={t('pages.clipboard.readText.title')}
          sdk={{
            name: 'getClipboardText',
            description: t('pages.clipboard.getClipboardText.description'),
            params: [],
            execute: () => getClipboardText(),
            snippet: getClipboardTextSnippet,
            docsUrl: docsLink('clipboard', 'getClipboardText'),
          }}
          polyfill={{
            name: 'navigator.clipboard.readText',
            description: t('pages.clipboard.navigatorReadText.description'),
            params: [],
            execute: () => navigator.clipboard.readText(),
            snippet: clipboardReadTextSnippet,
          }}
        />
      </div>
    </div>
  );
}
