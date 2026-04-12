import { useState, useCallback } from 'react';
import { ParamInput } from './ParamInput';
import { ResultView } from './ResultView';
import { HistoryLog, type HistoryEntry } from './HistoryLog';

export interface ParamDef {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'toggle' | 'select';
  options?: { label: string; value: string }[];
  placeholder?: string;
  defaultValue?: string;
  /** Optional transformer applied to the raw string value before passing to execute. */
  parse?: (raw: string) => unknown;
}

interface ApiCardProps {
  name: string;
  description?: string;
  params?: ParamDef[];
  execute: (params: Record<string, unknown>) => Promise<unknown>;
}

export function ApiCard({ name, description, params = [], execute }: ApiCardProps) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(params.map((p) => [p.name, p.defaultValue ?? '']))
  );
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<unknown>(undefined);
  const [error, setError] = useState<string>('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const handleExecute = useCallback(async () => {
    setStatus('loading');
    try {
      // Apply parse transforms for params that define one; otherwise pass raw string
      const parsed: Record<string, unknown> = {};
      for (const p of params) {
        const raw = values[p.name] ?? '';
        parsed[p.name] = p.parse ? p.parse(raw) : raw;
      }
      const data = await execute(parsed);
      setStatus('success');
      setResult(data);
      setHistory((prev) => [{ timestamp: Date.now(), status: 'success' as const, data }, ...prev].slice(0, 20));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatus('error');
      setError(msg);
      setHistory((prev) => [{ timestamp: Date.now(), status: 'error' as const, error: msg }, ...prev].slice(0, 20));
    }
  }, [execute, values, params]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 font-mono">{name}</h3>
      </div>
      {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}

      {params.length > 0 && (
        <div className="mt-3 space-y-1">
          {params.map((p) => (
            <ParamInput
              key={p.name}
              label={p.label}
              value={values[p.name] ?? ''}
              onChange={(v) => setValues((prev) => ({ ...prev, [p.name]: v }))}
              type={p.type}
              options={p.options}
              placeholder={p.placeholder}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={handleExecute}
        disabled={status === 'loading'}
        className="mt-3 w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
      >
        실행
      </button>

      <ResultView status={status} data={result} error={error} />
      <HistoryLog entries={history} />
    </div>
  );
}
