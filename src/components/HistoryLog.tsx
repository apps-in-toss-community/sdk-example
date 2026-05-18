import { t } from '../i18n';

export interface HistoryEntry {
  id: string;
  timestamp: number;
  status: 'success' | 'error';
  data?: unknown;
  error?: string;
}

export function createHistoryEntry(fields: Omit<HistoryEntry, 'id' | 'timestamp'>): HistoryEntry {
  return { id: crypto.randomUUID(), timestamp: Date.now(), ...fields };
}

export const HISTORY_CAP = 20;

/** Prepend `next` to `prev` and cap the result at `HISTORY_CAP` entries. */
export function appendHistory(prev: HistoryEntry[], next: HistoryEntry): HistoryEntry[] {
  return [next, ...prev].slice(0, HISTORY_CAP);
}

interface HistoryLogProps {
  entries: HistoryEntry[];
  /** When provided and `entries` is non-empty, a "Clear" button appears in the header. */
  onClear?: () => void;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function HistoryLog({ entries, onClear }: HistoryLogProps) {
  if (entries.length === 0) return null;

  return (
    <div className="mt-3 border-t border-gray-100 pt-2 dark:border-gray-800">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {t('historyLog.title', { count: entries.length })}
        </p>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            aria-label={t('historyLog.clearAriaLabel')}
            className="text-xs text-gray-500 hover:text-gray-900 underline-offset-2 hover:underline dark:text-gray-400 dark:hover:text-gray-100"
          >
            {t('historyLog.clear')}
          </button>
        )}
      </div>
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {entries.map((entry) => (
          <div key={entry.id} className="flex items-start gap-2 text-xs">
            <span className="text-gray-400 shrink-0 dark:text-gray-500">
              {formatTime(entry.timestamp)}
            </span>
            <span
              className={`min-w-0 break-all ${
                entry.status === 'error'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-green-600 dark:text-green-400'
              }`}
            >
              {entry.status === 'error'
                ? entry.error
                : entry.data === undefined
                  ? t('historyLog.noData')
                  : JSON.stringify(entry.data)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
