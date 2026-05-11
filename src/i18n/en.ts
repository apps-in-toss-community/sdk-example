// English locale — currently re-exports ko (primary locale) so `t()` returns
// the ko string when locale === 'en'. When real English translations land,
// change this to a `Partial<Record<StringKey, string>>` with only the translated
// keys; the `t()` lookup will then fall back to the key literal for any
// untranslated entry, surfacing the gap visibly.
import { ko } from './ko';

export const en: typeof ko = ko;
