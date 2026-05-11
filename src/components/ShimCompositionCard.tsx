import { isTossEnvironment } from '@ait-co/polyfill/detect';
import { getAppsInTossGlobals } from '@apps-in-toss/web-framework';
import { useCallback, useEffect, useState } from 'react';
import { interleave, t } from '../i18n';

type CompositionMode = 'mock-via-polyfill' | 'sdk-direct' | 'polyfill-direct' | 'unknown';

interface AitDevtoolsWindow {
  __ait?: { state?: { mockData?: { clipboardText?: string } } };
}

function detectSdkPresent(): boolean {
  try {
    const globals = getAppsInTossGlobals();
    return Boolean(globals) && typeof globals === 'object';
  } catch {
    return false;
  }
}

// Polyfill stashes the pre-shim clipboard at this well-known Symbol when it
// installs (see `installClipboardShim` in @ait-co/polyfill). The Symbol is
// keyed by `Symbol.for(...)`, so any consumer can probe for it without an
// import-time coupling — it survives bundling and code-splitting.
const POLYFILL_CLIPBOARD_BACKUP = Symbol.for('@ait-co/polyfill/clipboard.original');

function detectPolyfillLoaded(): boolean {
  if (typeof navigator === 'undefined') return false;
  return POLYFILL_CLIPBOARD_BACKUP in navigator;
}

function readMockClipboardText(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as unknown as AitDevtoolsWindow).__ait?.state?.mockData?.clipboardText;
}

function deriveMode(sdkPresent: boolean, polyfillLoaded: boolean): CompositionMode {
  if (sdkPresent && polyfillLoaded) return 'mock-via-polyfill';
  if (sdkPresent && !polyfillLoaded) return 'sdk-direct';
  if (!sdkPresent && polyfillLoaded) return 'polyfill-direct';
  return 'unknown';
}

const MODE_DESCRIPTION_KEY: Record<CompositionMode, Parameters<typeof t>[0]> = {
  'mock-via-polyfill': 'shimComposition.mode.mockViaPolyfill',
  'sdk-direct': 'shimComposition.mode.sdkDirect',
  'polyfill-direct': 'shimComposition.mode.polyfillDirect',
  unknown: 'shimComposition.mode.unknown',
};

type RoundTripStatus = 'idle' | 'running' | 'ok' | 'mismatch' | 'error';

export function ShimCompositionCard() {
  const [sdkPresent, setSdkPresent] = useState<boolean | undefined>(undefined);
  const [polyfillLoaded, setPolyfillLoaded] = useState<boolean | undefined>(undefined);
  const [tossEnv, setTossEnv] = useState<boolean | undefined>(undefined);
  const [roundTrip, setRoundTrip] = useState<RoundTripStatus>('idle');
  const [roundTripMessage, setRoundTripMessage] = useState<string>('');

  useEffect(() => {
    setSdkPresent(detectSdkPresent());
    setPolyfillLoaded(detectPolyfillLoaded());
    let cancelled = false;
    isTossEnvironment().then((v) => {
      if (!cancelled) setTossEnv(v);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const mode: CompositionMode =
    sdkPresent === undefined || polyfillLoaded === undefined
      ? 'unknown'
      : deriveMode(sdkPresent, polyfillLoaded);

  const runRoundTrip = useCallback(async () => {
    setRoundTrip('running');
    setRoundTripMessage('');
    const probe = `aitc-shim-probe-${Date.now()}`;
    try {
      await navigator.clipboard.writeText(probe);
      const seen = readMockClipboardText();
      if (seen === probe) {
        setRoundTrip('ok');
        setRoundTripMessage(`devtools mockData.clipboardText === probe (${probe})`);
      } else if (seen === undefined) {
        setRoundTrip('mismatch');
        setRoundTripMessage(t('shimComposition.roundTrip.mismatchUndefined'));
      } else {
        setRoundTrip('mismatch');
        setRoundTripMessage(t('shimComposition.roundTrip.mismatchOther', { seen }));
      }
    } catch (err) {
      setRoundTrip('error');
      setRoundTripMessage(err instanceof Error ? err.message : String(err));
    }
  }, []);

  return (
    <div
      data-testid="shim-composition-card"
      className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
    >
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {t('shimComposition.title')}
      </h3>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {t('shimComposition.description')}
      </p>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <Row label={t('shimComposition.sdkPresent')} value={sdkPresent} />
        <Row label={t('shimComposition.polyfillLoaded')} value={polyfillLoaded} />
        <Row label={t('shimComposition.isTossEnvironment')} value={tossEnv} />
      </dl>

      <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-950">
        <p className="text-xs">
          <span className="text-gray-500 dark:text-gray-400">{t('shimComposition.mode')}</span>{' '}
          <code
            data-testid="shim-composition-mode"
            className="ml-1 rounded bg-gray-900 px-1.5 py-0.5 font-mono text-[11px] text-gray-100 dark:bg-gray-100 dark:text-gray-900"
          >
            {mode}
          </code>
        </p>
        <p className="mt-1 text-[11px] text-gray-600 dark:text-gray-300">
          {t(MODE_DESCRIPTION_KEY[mode])}
        </p>
      </div>

      <div className="mt-3">
        <button
          type="button"
          onClick={runRoundTrip}
          disabled={roundTrip === 'running'}
          className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
        >
          {t('shimComposition.runRoundTrip')}
        </button>
        <p
          data-testid="shim-composition-roundtrip"
          data-status={roundTrip}
          className="mt-2 text-[11px] text-gray-600 dark:text-gray-300"
        >
          {roundTrip === 'idle' && t('shimComposition.roundTripIdle')}
          {roundTrip === 'running' && t('shimComposition.roundTripRunning')}
          {roundTrip === 'ok' && `OK — ${roundTripMessage}`}
          {roundTrip === 'mismatch' && `MISMATCH — ${roundTripMessage}`}
          {roundTrip === 'error' && `ERROR — ${roundTripMessage}`}
        </p>
      </div>

      <p className="mt-3 text-[11px] text-gray-400 dark:text-gray-500">
        {interleave(
          t('shimComposition.devOnlyNote'),
          '{windowAit}',
          <code className="font-mono">window.__ait</code>,
        )}
      </p>
    </div>
  );
}

interface RowProps {
  label: string;
  value: boolean | undefined;
}

function Row({ label, value }: RowProps) {
  const text =
    value === undefined
      ? t('shimComposition.row.pending')
      : value
        ? t('shimComposition.row.yes')
        : t('shimComposition.row.no');
  const tone =
    value === undefined
      ? 'text-gray-400'
      : value
        ? 'text-emerald-700 dark:text-emerald-400'
        : 'text-gray-500';
  return (
    <>
      <dt className="text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className={`font-mono ${tone}`} data-testid={`shim-row-${label}`}>
        {text}
      </dd>
    </>
  );
}
