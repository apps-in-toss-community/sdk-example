import { type ReactNode, useId, useRef, useState } from 'react';
import type { ParamDef } from './ApiCard';
import { CodeSnippet } from './CodeSnippet';
import { createHistoryEntry, type HistoryEntry, HistoryLog } from './HistoryLog';
import { ParamInput } from './ParamInput';
import { ResultView } from './ResultView';

// biome-ignore lint/suspicious/noExplicitAny: variance helper — same pattern as ApiCard
type AnyParamDef = ParamDef<any>;

type ParsedParam<P extends AnyParamDef> = P extends { parse: (raw: string) => infer T }
  ? T
  : string;

// biome-ignore lint/suspicious/noExplicitAny: idiomatic distributive-conditional pattern
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void
  ? I
  : never;

type ParamEntry<P extends AnyParamDef> = P extends { name: infer N extends string }
  ? { [K in N]: ParsedParam<P> }
  : never;

type ParamsRecord<Params extends AnyParamDef[]> =
  UnionToIntersection<ParamEntry<Params[number]>> extends infer T ? T : never;

interface ModeConfig<Params extends AnyParamDef[]> {
  name: string;
  description?: string;
  params: readonly [...Params];
  execute: (params: ParamsRecord<Params>) => Promise<unknown>;
  snippet?: string;
  docsUrl?: string;
}

interface PolyfillToggleCardProps<
  SdkParams extends AnyParamDef[],
  PolyParams extends AnyParamDef[],
> {
  title: string;
  sdk: ModeConfig<SdkParams>;
  polyfill: ModeConfig<PolyParams>;
}

type Mode = 'sdk' | 'polyfill';
type Status = 'idle' | 'loading' | 'success' | 'error';

interface ModeState {
  values: Record<string, string>;
  status: Status;
  result: unknown;
  error: string;
  history: HistoryEntry[];
}

function initState(params: readonly AnyParamDef[]): ModeState {
  return {
    values: Object.fromEntries(params.map((p) => [p.name, p.defaultValue ?? ''])),
    status: 'idle',
    result: undefined,
    error: '',
    history: [],
  };
}

export function PolyfillToggleCard<
  const SdkParams extends AnyParamDef[],
  const PolyParams extends AnyParamDef[],
>({ title, sdk, polyfill }: PolyfillToggleCardProps<SdkParams, PolyParams>) {
  const panelId = useId();
  const sdkTabId = useId();
  const polyTabId = useId();
  const [mode, setMode] = useState<Mode>('sdk');
  const [sdkState, setSdkState] = useState<ModeState>(() => initState(sdk.params));
  const [polyState, setPolyState] = useState<ModeState>(() => initState(polyfill.params));
  // Synchronous monotonic counter per mode. Guards the stale-settle race
  // where two clicks fire before React commits — closure-captured state
  // would give both calls the same id, so they'd both pass `prev.callId !==`.
  const sdkCallId = useRef(0);
  const polyCallId = useRef(0);

  const isSdk = mode === 'sdk';
  const config = isSdk ? sdk : polyfill;
  const state = isSdk ? sdkState : polyState;
  const setState = isSdk ? setSdkState : setPolyState;

  function setValue(name: string, value: string) {
    setState((prev) => ({ ...prev, values: { ...prev.values, [name]: value } }));
  }

  async function handleExecute() {
    const callIdRef = isSdk ? sdkCallId : polyCallId;
    callIdRef.current += 1;
    const callId = callIdRef.current;
    setState((prev) => ({ ...prev, status: 'loading' }));

    try {
      const parsed: Record<string, unknown> = {};
      for (const p of config.params) {
        const raw = state.values[p.name] ?? '';
        parsed[p.name] = p.parse ? p.parse(raw) : raw;
      }
      // Call the mode-specific execute directly so each branch keeps its own
      // params type. The runtime payload is a Record keyed by param name; the
      // generic types on each ModeConfig handle inference for callers already.
      const data = isSdk
        ? await sdk.execute(parsed as ParamsRecord<SdkParams>)
        : await polyfill.execute(parsed as ParamsRecord<PolyParams>);
      if (callIdRef.current !== callId) return;
      setState((prev) => ({
        ...prev,
        status: 'success',
        result: data,
        error: '',
        history: [createHistoryEntry({ status: 'success', data }), ...prev.history].slice(0, 20),
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (callIdRef.current !== callId) return;
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: msg,
        history: [createHistoryEntry({ status: 'error', error: msg }), ...prev.history].slice(
          0,
          20,
        ),
      }));
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        {config.docsUrl && (
          <a
            href={config.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 underline-offset-2 hover:underline"
          >
            Docs ↗
          </a>
        )}
      </div>

      <div
        role="tablist"
        aria-label={`${title} 호출 경로`}
        className="mt-2 inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 text-xs dark:border-gray-800 dark:bg-gray-950"
      >
        <ToggleButton
          id={sdkTabId}
          active={isSdk}
          onClick={() => setMode('sdk')}
          controls={panelId}
        >
          SDK
        </ToggleButton>
        <ToggleButton
          id={polyTabId}
          active={!isSdk}
          onClick={() => setMode('polyfill')}
          controls={panelId}
        >
          Polyfill
        </ToggleButton>
      </div>

      <div
        id={panelId}
        role="tabpanel"
        aria-labelledby={isSdk ? sdkTabId : polyTabId}
        className="motion-safe:transition-opacity"
      >
        <p className="mt-2 text-xs font-mono text-gray-700 dark:text-gray-300">{config.name}</p>
        {config.description && (
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{config.description}</p>
        )}

        {config.params.length > 0 && (
          <div className="mt-3 space-y-1">
            {config.params.map((p) => (
              <ParamInput
                key={p.name}
                label={p.label}
                value={state.values[p.name] ?? ''}
                onChange={(v) => setValue(p.name, v)}
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
          disabled={state.status === 'loading'}
          className="mt-3 w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
        >
          실행
        </button>

        {config.snippet ? (
          <div className="mt-2 grid gap-2 md:grid-cols-2 md:items-start">
            <div>
              <ResultView status={state.status} data={state.result} error={state.error} />
              <HistoryLog entries={state.history} />
            </div>
            <CodeSnippet code={config.snippet} label={`${config.name} source snippet`} />
          </div>
        ) : (
          <>
            <ResultView status={state.status} data={state.result} error={state.error} />
            <HistoryLog entries={state.history} />
          </>
        )}
      </div>
    </div>
  );
}

interface ToggleButtonProps {
  id: string;
  active: boolean;
  onClick: () => void;
  controls: string;
  children: ReactNode;
}

function ToggleButton({ id, active, onClick, controls, children }: ToggleButtonProps) {
  return (
    <button
      id={id}
      type="button"
      role="tab"
      aria-selected={active}
      aria-controls={controls}
      data-active={active}
      onClick={onClick}
      className="rounded-md px-2.5 py-1 font-medium text-gray-500 data-[active=true]:bg-white data-[active=true]:text-gray-900 data-[active=true]:shadow-sm dark:text-gray-400 dark:data-[active=true]:bg-gray-800 dark:data-[active=true]:text-gray-100 motion-safe:transition-colors"
    >
      {children}
    </button>
  );
}
