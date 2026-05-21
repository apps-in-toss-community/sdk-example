import { t } from '../i18n';
import { docsLink } from '../lib/docs';

/**
 * Small "Docs ↗" anchor rendered next to bespoke (non-ApiCard) section
 * headers. Doubles as the verify-crosslinks signal — `docsLink(namespace,
 * method)` is what the docs scanner picks up via DOCS_LINK_JSX_REGEX.
 */
export function DocsLink({ namespace, method }: { namespace: string; method: string }) {
  return (
    <a
      href={docsLink(namespace, method)}
      target="_blank"
      rel="noopener noreferrer"
      className="shrink-0 text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 underline-offset-2 hover:underline"
    >
      {t('apiCard.docsLink')}
    </a>
  );
}
