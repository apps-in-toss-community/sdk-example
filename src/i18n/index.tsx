import { Fragment, type ReactNode } from 'react';
import { en } from './en';
import { ko, type StringKey } from './ko';

export type Locale = 'ko' | 'en';

export const locale: Locale = 'ko';

// `ko` is the source of truth (Record<StringKey, string>). Other locales are
// allowed to be partial so that, once en.ts grows real translations, missing
// keys typecheck-fail loudly and the runtime `?? key` fallback below is the
// live safety net (rather than dead code under a stricter type).
const tables: Record<Locale, Partial<Record<StringKey, string>>> = { ko, en };

/**
 * Look up a UI string for the current locale, with optional `{name}` placeholder
 * interpolation. Falls back to the key itself if a translation is missing, so a
 * forgotten key surfaces visibly rather than rendering as empty.
 */
export function t(key: StringKey, vars?: Record<string, string | number>): string {
  const raw = tables[locale][key] ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = vars[name];
    return value === undefined ? match : String(value);
  });
}

export type { StringKey };

/**
 * Split a localized string at `placeholder` and interleave a React node at each
 * split point. Used to inject an element (e.g. `<code>...</code>`) into the
 * middle of a translated string without giving up locale extraction.
 *
 * Returns keyed `<Fragment>` pairs so callers can render the result as JSX
 * children without React warning about missing keys.
 *
 * Example: `interleave(t('foo.desc'), '{webApis}', <code>{webApis}</code>)`
 */
export function interleave(text: string, placeholder: string, node: ReactNode): ReactNode {
  const parts = text.split(placeholder);
  return parts.map((part, i) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: parts come from a static string split — order is fixed by the placeholder positions in the source string and never reorders.
    <Fragment key={i}>
      {part}
      {i < parts.length - 1 && node}
    </Fragment>
  ));
}
