export interface HistoryEntry {
  timestamp: number;
  status: 'success' | 'error';
  data?: unknown;
  error?: string;
}

interface HistoryLogProps {
  entries: HistoryEntry[];
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function HistoryLog({ entries }: HistoryLogProps) {
  if (entries.length === 0) return null;

  return (
    <div className="mt-3 border-t border-gray-100 pt-2">
      <p className="text-xs font-medium text-gray-500 mb-1">History ({entries.length})</p>
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {entries.map((entry, i) => (
          <div key={`${entry.timestamp}-${i}`} className="flex items-start gap-2 text-xs">
            <span className="text-gray-400 shrink-0">{formatTime(entry.timestamp)}</span>
            <span className={entry.status === 'error' ? 'text-red-600' : 'text-green-600'}>
              {entry.status === 'error' ? entry.error : entry.data === undefined ? '(no data)' : JSON.stringify(entry.data)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
