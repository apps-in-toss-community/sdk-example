import { isTossEnvironment } from '@ait-co/polyfill/detect';
import { getAppsInTossGlobals } from '@apps-in-toss/web-framework';
import { useCallback, useEffect, useState } from 'react';

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

const MODE_DESCRIPTION: Record<CompositionMode, string> = {
  'mock-via-polyfill':
    'devtools mock + polyfill 둘 다 감지됨. polyfill이 SDK를 "present"로 인식해 mock 경유로 라우팅하는 게 의도된 합성입니다. 실제 라우팅까지 확인하려면 아래 round-trip을 실행하세요.',
  'sdk-direct':
    'SDK는 감지됐지만 polyfill이 활성화되지 않았습니다. 페이지가 SDK를 직접 호출합니다.',
  'polyfill-direct':
    'SDK가 감지되지 않아 polyfill이 브라우저 네이티브 Web API로 fall-through합니다.',
  unknown: '감지가 아직 끝나지 않았거나 두 경로 모두 비활성입니다.',
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
        setRoundTripMessage(
          'devtools mock state(window.__ait)가 노출되지 않았습니다. polyfill이 native browser clipboard로 fall-through했을 가능성이 큽니다.',
        );
      } else {
        setRoundTrip('mismatch');
        setRoundTripMessage(`writeText 호출은 성공했지만 mock state가 갱신되지 않음. seen=${seen}`);
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
        Shim composition (devtools × polyfill)
      </h3>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        @ait-co/devtools mock과 @ait-co/polyfill shim이 어떻게 합성되는지 페이지 로드 기준으로
        진단합니다.
      </p>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <Row label="SDK present" value={sdkPresent} />
        <Row label="Polyfill loaded" value={polyfillLoaded} />
        <Row label="isTossEnvironment()" value={tossEnv} />
      </dl>

      <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-950">
        <p className="text-xs">
          <span className="text-gray-500 dark:text-gray-400">Composition mode</span>{' '}
          <code
            data-testid="shim-composition-mode"
            className="ml-1 rounded bg-gray-900 px-1.5 py-0.5 font-mono text-[11px] text-gray-100 dark:bg-gray-100 dark:text-gray-900"
          >
            {mode}
          </code>
        </p>
        <p className="mt-1 text-[11px] text-gray-600 dark:text-gray-300">
          {MODE_DESCRIPTION[mode]}
        </p>
      </div>

      <div className="mt-3">
        <button
          type="button"
          onClick={runRoundTrip}
          disabled={roundTrip === 'running'}
          className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
        >
          writeText round-trip 실행
        </button>
        <p
          data-testid="shim-composition-roundtrip"
          data-status={roundTrip}
          className="mt-2 text-[11px] text-gray-600 dark:text-gray-300"
        >
          {roundTrip === 'idle' &&
            'navigator.clipboard.writeText 호출이 mock state를 갱신하는지 확인합니다.'}
          {roundTrip === 'running' && '실행 중…'}
          {roundTrip === 'ok' && `OK — ${roundTripMessage}`}
          {roundTrip === 'mismatch' && `MISMATCH — ${roundTripMessage}`}
          {roundTrip === 'error' && `ERROR — ${roundTripMessage}`}
        </p>
      </div>

      <p className="mt-3 text-[11px] text-gray-400 dark:text-gray-500">
        prod 빌드/실 디바이스에선 <code className="font-mono">window.__ait</code>가 없어 mock-state
        검증은 dev에서만 의미 있습니다.
      </p>
    </div>
  );
}

interface RowProps {
  label: string;
  value: boolean | undefined;
}

function Row({ label, value }: RowProps) {
  const text = value === undefined ? '…' : value ? 'yes' : 'no';
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
