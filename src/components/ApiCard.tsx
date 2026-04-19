import { useState } from 'react';
import { createHistoryEntry, type HistoryEntry, HistoryLog } from './HistoryLog';
import { ParamInput } from './ParamInput';
import { ResultView } from './ResultView';

export interface ParamDef<T = string> {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'toggle' | 'select';
  options?: { label: string; value: string }[];
  placeholder?: string;
  defaultValue?: string;
  /** Optional transformer applied to the raw string value before passing to execute. */
  parse?: (raw: string) => T;
}

/**
 * Variance helper — must be `any`, not `unknown`.
 * A `ParamDef<unknown>` cannot accept a `ParamDef<number>` in a covariant tuple position,
 * which would break type inference in the variadic helpers below.
 */
// biome-ignore lint/suspicious/noExplicitAny: variance helper — unknown breaks inference
type AnyParamDef = ParamDef<any>;

/**
 * Resolve the parsed value type for a single param.
 * Uses a function-shape match `parse: (raw: string) => infer T` rather than
 * `parse: infer F` to avoid matching `parse: undefined` — if `ParamDef.parse`
 * ever becomes `((raw: string) => T) | undefined` this conditional stays correct.
 */
type ParsedParam<P extends AnyParamDef> = P extends { parse: (raw: string) => infer T }
  ? T
  : string;

/** Merge a union of types into a single intersection type. */
// biome-ignore lint/suspicious/noExplicitAny: idiomatic distributive-conditional pattern; using `unknown` changes inference semantics in subtle ways
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void
  ? I
  : never;

/**
 * Map a single ParamDef to `{ [literalName]: parsedType }`.
 * Captures the literal name via `infer N extends string` so the resulting
 * object type has a named property rather than an index signature — this
 * prevents `noUncheckedIndexedAccess` from widening the value to `T | undefined`.
 */
type ParamEntry<P extends AnyParamDef> = P extends { name: infer N extends string }
  ? { [K in N]: ParsedParam<P> }
  : never;

/**
 * Map a variadic tuple of ParamDefs to a single object type keyed by each
 * param's literal name, with the value type inferred from `parse` (or `string`).
 *
 * Uses `UnionToIntersection` to collapse the union of `ParamEntry` types into
 * one flat object. The `const Params` type parameter (below) ensures TypeScript
 * infers literal string names rather than widening them to `string`.
 */
type ParamsRecord<Params extends AnyParamDef[]> =
  UnionToIntersection<ParamEntry<Params[number]>> extends infer T ? T : never;

interface ApiCardProps<Params extends AnyParamDef[]> {
  name: string;
  description?: string;
  params: readonly [...Params];
  execute: (params: ParamsRecord<Params>) => Promise<unknown>;
}

/**
 * `const Params` is a TypeScript 5.0 const type parameter.
 * It infers the `params` array as a `readonly` tuple with literal string `name`
 * values — enabling `ParamsRecord` to produce named properties instead of an
 * index signature, which in turn satisfies `noUncheckedIndexedAccess`.
 */
export function ApiCard<const Params extends AnyParamDef[]>({
  name,
  description,
  params,
  execute,
}: ApiCardProps<Params>) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(params.map((p) => [p.name, p.defaultValue ?? ''])),
  );
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<unknown>(undefined);
  const [error, setError] = useState<string>('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  async function handleExecute() {
    setStatus('loading');
    try {
      // Apply parse transforms for params that define one; otherwise pass raw string
      const parsed: Record<string, unknown> = {};
      for (const p of params) {
        const raw = values[p.name] ?? '';
        parsed[p.name] = p.parse ? p.parse(raw) : raw;
      }
      const data = await execute(parsed as ParamsRecord<Params>);
      setStatus('success');
      setResult(data);
      setHistory((prev) => [createHistoryEntry({ status: 'success', data }), ...prev].slice(0, 20));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatus('error');
      setError(msg);
      setHistory((prev) =>
        [createHistoryEntry({ status: 'error', error: msg }), ...prev].slice(0, 20),
      );
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 font-mono dark:text-gray-100">{name}</h3>
      </div>
      {description && (
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{description}</p>
      )}

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
        className="mt-3 w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
      >
        실행
      </button>

      <ResultView status={status} data={result} error={error} />
      <HistoryLog entries={history} />
    </div>
  );
}
