import { useEffect, useState } from 'react';
import { t } from '../i18n';

/**
 * Relay attach connection state.
 *
 * - `connecting`: URL carries `?debug=1` or `?relay=` but `window.__sdkCall`
 *   is not yet present. Shows a yellow pulsing dot.
 * - `connected`: `window.__sdkCall` is present (dogfood bridge installed by
 *   `src/debug/sdkBridge.ts`). Shows a green dot.
 * - `failed`: polling timed out without detecting the bridge. Shows a red dot.
 */
type AttachState = 'connecting' | 'connected' | 'failed';

const POLL_INTERVAL_MS = 500;
const TIMEOUT_MS = 15_000;

/**
 * Returns true when the current URL signals a debug/relay attach intent.
 * Matches `?debug=1` (the gate opt-in param) or `?relay=` (relay URL param).
 */
function isDebugUrl(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.get('debug') === '1' || params.has('relay');
}

/**
 * Small fixed-position dot (16 px) in the top-right corner that shows the
 * relay attach state when the page is opened with `?debug=1` or `?relay=`.
 *
 * Display conditions:
 * - Only rendered when `isDebugUrl()` returns true.
 * - No click/tap action — purely informational.
 * - Accessible via `aria-label` reflecting the current state.
 *
 * State transitions:
 * - `connecting` (yellow, pulse) — waiting for `window.__sdkCall` to appear.
 * - `connected` (green) — `window.__sdkCall` is present.
 * - `failed` (red) — timed out after {@link TIMEOUT_MS} ms without detecting bridge.
 *
 * Driven purely by URL params (`?debug=1` / `?relay=`) — works in any build
 * that carries those params, including `pnpm dev` with the mock bridge.
 */
export function AttachStatusIcon() {
  const [visible] = useState(isDebugUrl);
  const [state, setState] = useState<AttachState>('connecting');

  useEffect(() => {
    if (!visible) return;

    // Fast-path: bridge already installed (e.g. dev build's sdkBridge.ts ran
    // synchronously before React mounted).
    if (typeof window.__sdkCall === 'function') {
      setState('connected');
      return;
    }

    const startTime = Date.now();

    const intervalId = setInterval(() => {
      if (typeof window.__sdkCall === 'function') {
        setState('connected');
        clearInterval(intervalId);
        return;
      }
      if (Date.now() - startTime >= TIMEOUT_MS) {
        setState('failed');
        clearInterval(intervalId);
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [visible]);

  if (!visible) return null;

  const colorClass =
    state === 'connected'
      ? 'bg-green-500'
      : state === 'failed'
        ? 'bg-red-500'
        : 'bg-yellow-400';

  const ariaLabel = t(`attachStatus.${state}`);

  return (
    <div
      role="status"
      aria-label={ariaLabel}
      aria-live="polite"
      className="fixed top-3 right-3 z-50"
    >
      <span
        className={`block h-4 w-4 rounded-full ${colorClass} shadow-sm${state === 'connecting' ? ' animate-pulse' : ''}`}
      />
    </div>
  );
}
