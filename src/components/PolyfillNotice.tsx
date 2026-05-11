import { interleave, t } from '../i18n';

interface PolyfillNoticeProps {
  /**
   * Short description listing which standard Web APIs this page demonstrates
   * alongside the SDK calls. Rendered as inline code-ish text.
   */
  webApis: string;
}

/**
 * Banner shown on pages where `@ait-co/polyfill` exposes a standard Web API
 * equivalent of the SDK calls below. The polyfill installs globally from
 * `main.tsx`, so these APIs work on this page too — both entry points are
 * listed side-by-side so the reader can pick the one that fits their codebase.
 */
export function PolyfillNotice({ webApis }: PolyfillNoticeProps) {
  return (
    <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-900 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-200">
      <p className="font-medium">{t('polyfillNotice.title')}</p>
      <p className="mt-0.5">
        {interleave(
          t('polyfillNotice.description'),
          '{webApis}',
          <code className="font-mono">{webApis}</code>,
        )}
      </p>
    </div>
  );
}
