import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@ait-co/polyfill/auto';
import './index.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Install the SDK bridge (`window.__sdk` / `window.__sdkCall`) in the two
// scenarios where an agent drives SDK calls over a CDP relay:
//
//   1. `import.meta.env.DEV` — env 1 (plain `pnpm dev`). The unplugin alias
//      resolves `@apps-in-toss/web-framework` to the devtools mock, so the
//      bridge exposes the mock SDK for local-browser debugging.
//   2. `?debug=1` / `?relay=` in the URL — env 3/4 (on-device `.ait` bundle
//      opened through a debug/relay deep-link). A production `ait build` is a
//      Vite production build, so `import.meta.env.DEV` is `false` there and
//      condition 1 alone would DCE the bridge out of the shipped bundle —
//      which silently broke on-device debugging when the previous
//      `__DEBUG_BUILD__` install path was removed (#143). The URL check keeps
//      the bridge available exactly when a debug entry asks for it.
//
// A normal production load (no debug params) matches neither condition, so the
// dynamic import is never evaluated and the SDK-bridge chunk stays dormant.
function shouldInstallSdkBridge(): boolean {
  if (import.meta.env.DEV) return true;
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('debug') === '1' || params.has('relay');
}

if (shouldInstallSdkBridge()) {
  void import('./debug/sdkBridge').then((m) => m.installSdkBridge());
}

// Relay CDP attach (env 2/3/4 — real device behind a Chii relay). #139 removed
// the old `__DEBUG_BUILD__` attach surface but never restored the attach call
// itself, so the page stopped connecting to the relay as a CDP target — the
// SDK bridge above is only useful once that connection exists. `maybeAttach`
// re-runs the full in-app gate (debug=1 + wss relay + TOTP `at`), so this
// outer check is just a cheap guard that keeps the chunk dormant on normal
// loads, same pattern as the bridge install above.
if (typeof window !== 'undefined') {
  const params = new URLSearchParams(window.location.search);
  if (params.get('debug') === '1' && params.has('relay')) {
    void import('@ait-co/devtools/in-app').then((m) => m.maybeAttach());
  }
}
