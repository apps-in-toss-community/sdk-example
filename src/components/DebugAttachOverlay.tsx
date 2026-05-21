import { useCallback, useState } from 'react';
import { t } from '../i18n';

/**
 * The `maybeAttach` entry point of `@ait-co/devtools/in-app`, threaded in from
 * `main.tsx`. Typed as a local function signature so this component keeps no
 * import-time dependency on `@ait-co/devtools/in-app` (gated behind
 * `__DEBUG_BUILD__`) and still renders in jsdom tests with a stub.
 */
export type MaybeAttach = (gateResult: {
  readonly attach: true;
  readonly relayUrl: string;
  readonly deploymentId: string;
}) => void;

/**
 * The validated gate result that activates this overlay.
 *
 * Mirrors `GateResultAttach` from `@ait-co/devtools/in-app` — kept as a local
 * structural interface so this component has no import-time dependency on
 * `@ait-co/devtools/in-app` (which is gated behind `__DEBUG_BUILD__` in
 * main.tsx) and renders cleanly in jsdom tests. The real gate type flows in
 * from `main.tsx` behind the `__DEBUG_BUILD__` guard.
 */
export interface DebugAttachGate {
  readonly relayUrl: string;
  readonly deploymentId: string;
}

type AttachStatus = 'idle' | 'attaching' | 'attached';

interface DebugAttachOverlayProps {
  readonly gate: DebugAttachGate;
  /** The secret token from the `token` query param, if the URL carried one. */
  readonly initialToken?: string;
  /**
   * `maybeAttach` from `@ait-co/devtools/in-app`, passed in from `main.tsx`.
   * When omitted (jsdom tests) the manual re-attach button is a no-op.
   */
  readonly maybeAttach?: MaybeAttach;
  /**
   * Whether `main.tsx` already auto-attached on gate pass. When `true` the
   * overlay opens in the `attached` state — it is then a status surface, and
   * the button re-attaches only if the operator edits the relay URL.
   */
  readonly autoAttached?: boolean;
}

/**
 * Floating status + re-attach surface for the in-app Debugging MCP — a floating
 * button visible on any page so regression diagnosis works regardless of the
 * current route.
 *
 * The 3-layer gate (`@ait-co/devtools/in-app` `checkDebugGate`) has already
 * passed by the time this mounts: a dogfood build (`__DEBUG_BUILD__`), a
 * `_deploymentId` entry, `?debug=1` opt-in, and a valid `wss:` relay URL. By
 * that point `main.tsx` has already called `maybeAttach` to inject the Chii
 * `target.js` script — attach is automatic, no click required. This overlay is
 * the human-facing status surface: it shows that auto-attach fired and lets an
 * operator re-attach to a different relay URL if they edit the field.
 *
 * Because the mount site in `main.tsx` is guarded by `if (__DEBUG_BUILD__)`,
 * this whole module is dead-code-eliminated from release bundles.
 */
export function DebugAttachOverlay({
  gate,
  initialToken = '',
  maybeAttach,
  autoAttached = false,
}: DebugAttachOverlayProps) {
  const [open, setOpen] = useState(false);
  const [relayUrl, setRelayUrl] = useState(gate.relayUrl);
  const [token, setToken] = useState(initialToken);
  const [status, setStatus] = useState<AttachStatus>(autoAttached ? 'attached' : 'idle');

  const handleAttach = useCallback(() => {
    setStatus('attaching');
    // Real re-attach: inject the Chii `target.js` for the (possibly edited)
    // relay URL. `maybeAttach` is idempotent — re-pointing the relay is the
    // only reason an operator clicks this after `main.tsx` already auto-attached.
    maybeAttach?.({ attach: true, relayUrl, deploymentId: gate.deploymentId });
    setStatus('attached');
  }, [relayUrl, gate.deploymentId, maybeAttach]);

  const statusMessage =
    status === 'attaching'
      ? t('debugAttach.statusAttaching')
      : status === 'attached'
        ? t('debugAttach.statusAttached')
        : token.length > 0
          ? t('debugAttach.statusReady')
          : t('debugAttach.statusNeedsToken');

  return (
    // Offset above the devtools panel toggle (`@ait-co/devtools/unplugin`
    // `panel: true`), which also pins to the bottom-right corner — without the
    // offset the two FABs overlap and the panel toggle eats the clicks.
    <div className="fixed right-3 bottom-16 z-50 flex max-w-[430px] flex-col items-end">
      {open && (
        <div
          data-testid="debug-attach-panel"
          className="mb-2 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-900"
        >
          <div className="flex items-start justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {t('debugAttach.title')}
            </h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t('debugAttach.closeAriaLabel')}
              className="-mt-1 -mr-1 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </div>

          <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            {t('debugAttach.hint')}
          </p>

          <dl className="mt-3 text-xs">
            <dt className="text-gray-500 dark:text-gray-400">{t('debugAttach.deploymentId')}</dt>
            <dd
              data-testid="debug-attach-deployment-id"
              className="mt-0.5 rounded bg-gray-100 px-2 py-1 font-mono text-[11px] break-all text-gray-800 dark:bg-gray-800 dark:text-gray-200"
            >
              {gate.deploymentId}
            </dd>
          </dl>

          <label className="mt-3 block text-xs text-gray-500 dark:text-gray-400">
            {t('debugAttach.relayUrl')}
            <input
              type="text"
              value={relayUrl}
              onChange={(e) => setRelayUrl(e.target.value)}
              placeholder={t('debugAttach.relayPlaceholder')}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 font-mono text-[11px] text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            />
          </label>

          <label className="mt-2 block text-xs text-gray-500 dark:text-gray-400">
            {t('debugAttach.token')}
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder={t('debugAttach.tokenPlaceholder')}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 font-mono text-[11px] text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            />
          </label>

          <button
            type="button"
            onClick={handleAttach}
            disabled={status === 'attaching' || relayUrl.length === 0}
            className="mt-3 w-full rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
          >
            {status === 'attaching' ? t('debugAttach.attaching') : t('debugAttach.attach')}
          </button>

          <p
            data-testid="debug-attach-status"
            data-status={status}
            className="mt-2 text-[11px] text-gray-600 dark:text-gray-300"
          >
            {statusMessage}
          </p>
        </div>
      )}

      <button
        type="button"
        data-testid="debug-attach-fab"
        onClick={() => setOpen((v) => !v)}
        aria-label={t('debugAttach.fabAriaLabel')}
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full bg-gray-900 px-3.5 py-2 text-xs font-semibold text-white shadow-lg transition-colors hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M10 1a4 4 0 0 0-3.446 1.96l-.93-.93a.75.75 0 1 0-1.06 1.06l1.2 1.2A3.99 3.99 0 0 0 6 6H4.75a.75.75 0 0 0 0 1.5h1.29a4.01 4.01 0 0 0-.04.5v.25H4.75a.75.75 0 0 0 0 1.5h1.25v.25c0 .17.014.337.04.5H4.75a.75.75 0 0 0 0 1.5H6c.09.69.36 1.32.766 1.85l-1.2 1.2a.75.75 0 1 0 1.06 1.06l.93-.93A4 4 0 0 0 14 14h1.25a.75.75 0 0 0 0-1.5h-1.29c.026-.163.04-.33.04-.5v-.25h1.25a.75.75 0 0 0 0-1.5H14V10c0-.17-.014-.337-.04-.5h1.29a.75.75 0 0 0 0-1.5H14a3.99 3.99 0 0 0-.764-1.85l1.2-1.2a.75.75 0 1 0-1.06-1.06l-.93.93A4 4 0 0 0 10 1Zm-.75 5.5a.75.75 0 0 1 1.5 0v5a.75.75 0 0 1-1.5 0v-5Z"
            clipRule="evenodd"
          />
        </svg>
        {t('debugAttach.fabLabel')}
      </button>
    </div>
  );
}
