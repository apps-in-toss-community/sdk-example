import { setClipboardText } from '@apps-in-toss/web-framework';
import { useState } from 'react';
import { t } from '../i18n';

/**
 * The gate evaluation result, mirrored structurally so this component has no
 * import-time dependency on `@ait-co/devtools/in-app` (which is gated behind
 * `__DEBUG_BUILD__` and dynamically imported in `main.tsx`).
 */
export interface DebugGateSnapshot {
  readonly attach: boolean;
  /** The gate's blocked-reason code, present only when `attach` is false. */
  readonly reason?: string;
}

interface DebugDiagnosticPanelProps {
  /** Raw `window.location.search` captured at mount time. */
  readonly locationSearch: string;
  /** The 3-layer gate result for the current URL. */
  readonly gate: DebugGateSnapshot;
}

/**
 * Builds the plain-text diagnostic block copied to the clipboard.
 *
 * Pure so it can be unit-tested without rendering. The block is meant to be
 * pasted back into a chat/issue verbatim: it carries the raw `location.search`,
 * each parsed param on its own line, the gate verdict, and the WebView's
 * `userAgent` — everything needed to diagnose why a gate layer blocked on a
 * real device.
 */
export function buildDiagnosticLog(locationSearch: string, gate: DebugGateSnapshot): string {
  const params = [...new URLSearchParams(locationSearch).entries()];
  const gateLine = gate.attach ? 'attach=true' : `attach=false reason=${gate.reason ?? '(none)'}`;

  return [
    '--- sdk-example debug diagnostic ---',
    `time: ${new Date().toISOString()}`,
    `location.search: ${locationSearch === '' ? '(empty)' : locationSearch}`,
    'params:',
    ...(params.length === 0 ? ['  (none)'] : params.map(([k, v]) => `  ${k}=${v}`)),
    `gate: ${gateLine}`,
    `userAgent: ${navigator.userAgent}`,
  ].join('\n');
}

/** Transient state of the "copy log" button, surfaced as the button label. */
type CopyState = 'idle' | 'copying' | 'copied' | 'failed';

/**
 * Always-visible diagnostic panel for dogfood builds.
 *
 * Unlike `DebugAttachOverlay` — which only mounts when the 3-layer gate fully
 * passes — this panel mounts whenever `__DEBUG_BUILD__` is true, regardless of
 * the gate result. It exists to answer one verification question: when the
 * mini-app is opened via an `intoss-private://` deep link, do arbitrary query
 * params (`debug=1`, `relay=…`) reach `window.location.search` inside the
 * WebView? That propagation is the unverified precondition of the
 * `build_attach_url` attach path (in-app debug MCP spec, open question 6).
 *
 * The mount site in `main.tsx` is guarded by `if (__DEBUG_BUILD__)`, so this
 * whole module is dead-code-eliminated from release bundles.
 */
export function DebugDiagnosticPanel({ locationSearch, gate }: DebugDiagnosticPanelProps) {
  const [open, setOpen] = useState(false);
  const [copyState, setCopyState] = useState<CopyState>('idle');

  // Parse the captured search string into visible key/value rows. Done at
  // render time from the prop (not `window`) so the panel reflects exactly
  // what was captured at mount.
  const params = [...new URLSearchParams(locationSearch).entries()];

  // Copy the diagnostic block via the Apps in Toss SDK clipboard API.
  // `setClipboardText` is used instead of `navigator.clipboard.writeText`
  // because this runs inside the Toss WebView, where the SDK path is the
  // reliable one (no secure-context / permission caveats). Static import is
  // safe: this whole module is DCE'd from release bundles by the
  // `if (__DEBUG_BUILD__)` guard in `main.tsx`.
  const handleCopy = async () => {
    setCopyState('copying');
    try {
      await setClipboardText(buildDiagnosticLog(locationSearch, gate));
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
    // Revert the label after a moment so the button is reusable.
    setTimeout(() => setCopyState('idle'), 2000);
  };

  const copyLabel: Record<CopyState, string> = {
    idle: t('debugDiag.copy'),
    copying: t('debugDiag.copying'),
    copied: t('debugDiag.copied'),
    failed: t('debugDiag.copyFailed'),
  };

  return (
    // Pin to the bottom-left so it never overlaps the devtools panel toggle or
    // the DebugAttachOverlay FAB (both bottom-right).
    <div className="fixed bottom-3 left-3 z-50 flex max-w-[430px] flex-col items-start">
      {open && (
        <div
          data-testid="debug-diagnostic-panel"
          className="mb-2 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-900"
        >
          <div className="flex items-start justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {t('debugDiag.title')}
            </h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t('debugDiag.closeAriaLabel')}
              className="-mt-1 -mr-1 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </div>

          <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">{t('debugDiag.hint')}</p>

          <dl className="mt-3 text-xs">
            <dt className="text-gray-500 dark:text-gray-400">{t('debugDiag.locationSearch')}</dt>
            <dd
              data-testid="debug-diagnostic-location-search"
              className="mt-0.5 rounded bg-gray-100 px-2 py-1 font-mono text-[11px] break-all text-gray-800 dark:bg-gray-800 dark:text-gray-200"
            >
              {locationSearch === '' ? t('debugDiag.locationSearchEmpty') : locationSearch}
            </dd>

            <dt className="mt-3 text-gray-500 dark:text-gray-400">{t('debugDiag.params')}</dt>
            <dd
              data-testid="debug-diagnostic-params"
              className="mt-0.5 rounded bg-gray-100 px-2 py-1 font-mono text-[11px] break-all text-gray-800 dark:bg-gray-800 dark:text-gray-200"
            >
              {params.length === 0
                ? '—'
                : params.map(([k, v]) => (
                    <div key={k}>
                      {k}={v}
                    </div>
                  ))}
            </dd>

            <dt className="mt-3 text-gray-500 dark:text-gray-400">{t('debugDiag.gateResult')}</dt>
            <dd
              data-testid="debug-diagnostic-gate"
              className="mt-0.5 rounded bg-gray-100 px-2 py-1 font-mono text-[11px] break-all text-gray-800 dark:bg-gray-800 dark:text-gray-200"
            >
              {t('debugDiag.gateAttach')}={String(gate.attach)}
              {gate.reason !== undefined ? ` · ${t('debugDiag.gateReason')}=${gate.reason}` : ''}
            </dd>
          </dl>

          <button
            type="button"
            data-testid="debug-diagnostic-copy"
            onClick={handleCopy}
            disabled={copyState === 'copying'}
            className="mt-3 w-full rounded-lg bg-gray-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-gray-600 disabled:opacity-60 dark:bg-gray-300 dark:text-gray-900 dark:hover:bg-gray-200"
          >
            {copyLabel[copyState]}
          </button>
        </div>
      )}

      <button
        type="button"
        data-testid="debug-diagnostic-fab"
        onClick={() => setOpen((v) => !v)}
        aria-label={t('debugDiag.fabAriaLabel')}
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full bg-gray-700 px-3.5 py-2 text-xs font-semibold text-white shadow-lg transition-colors hover:bg-gray-600 dark:bg-gray-300 dark:text-gray-900 dark:hover:bg-gray-200"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z"
            clipRule="evenodd"
          />
        </svg>
        {t('debugDiag.fabLabel')}
      </button>
    </div>
  );
}
