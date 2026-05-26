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

// In-app Debugging MCP attach surface (spec Phase 4).
//
// `__DEBUG_BUILD__` is a Vite `define` constant (see vite.config.ts) inlined as
// a literal `true` only in a `RELEASE_CHANNEL=dogfood` build. In every other
// build (dev, preview, release, tests) it folds to `false`, so the bundler
// dead-code-eliminates this entire block — the `@ait-co/devtools/in-app`
// import and the floating attach UI never reach a release bundle. This is the
// Layer A guarantee of the 3-layer activation gate.
//
// Must NOT statically import `@ait-co/devtools/in-app` at module top level —
// that would keep the module alive and defeat DCE.
if (__DEBUG_BUILD__) {
  void mountDebugSurfaces();
}

// Dev-only: expose the SDK bridge so the devtools MCP `call_sdk` tool can
// drive the mock SDK over a local-browser CDP attach (env 1, plain `pnpm dev`).
// In a dev build `@apps-in-toss/web-framework` resolves to the devtools mock
// via the unplugin alias — exactly the SDK surface env-1 debugging wants to
// exercise. Release builds DCE this via `import.meta.env.DEV === false`.
//
// Dogfood builds use `ait build` (a Vite production build), so
// `import.meta.env.DEV` is `false` there — no double-install with the
// `__DEBUG_BUILD__` path above.
if (import.meta.env.DEV) {
  void import('./debug/sdkBridge').then((m) => m.installSdkBridge());
}

/**
 * Mounts the dogfood-only debug surfaces.
 *
 * Two surfaces with different mount conditions:
 *
 *  - `DebugDiagnosticPanel` — mounts UNCONDITIONALLY in a dogfood build. It
 *    renders the raw `window.location.search`, the SDK `getSchemeUri()` entry
 *    URI, and the gate result, so an operator can see exactly which query
 *    params the WebView received and where. This is the instrument for
 *    verifying intoss-private deep-link query propagation (in-app debug MCP
 *    spec, open question 6).
 *  - `DebugAttachOverlay` — mounts only when all three gate layers pass
 *    (`_deploymentId` + `?debug=1` + a valid `wss:` relay). It is the actual
 *    attach UI.
 */
async function mountDebugSurfaces(): Promise<void> {
  // Expose the full SDK namespace on `window.__sdk` so an AI agent can drive
  // any SDK API over the CDP relay (`Runtime.evaluate`) — no human UI tap
  // needed to exercise e.g. `setDeviceOrientation`. Dogfood-only (DCE'd from
  // release). Installed before the gate check so it's available even when the
  // attach overlay doesn't mount.
  const { installSdkBridge } = await import('./debug/sdkBridge');
  await installSdkBridge();

  const { checkDebugGate, maybeAttach } = await import('@ait-co/devtools/in-app');
  const gate = checkDebugGate();
  const locationSearch = window.location.search;

  // Capture the SDK entry deep-link URI. Dynamically imported (rather than a
  // top-level static import) to keep `main.tsx` free of any SDK dependency
  // outside this `__DEBUG_BUILD__`-guarded block. `getSchemeUri()` is
  // synchronous; any throw is swallowed so the panel still mounts.
  let schemeUri = '';
  try {
    const { getSchemeUri } = await import('@apps-in-toss/web-framework');
    schemeUri = getSchemeUri();
  } catch {
    schemeUri = '';
  }

  // Diagnostic panel — always mounted in a dogfood build, gate result and all.
  const { DebugDiagnosticPanel } = await import('./components/DebugDiagnosticPanel');
  const diagHost = document.createElement('div');
  diagHost.id = 'debug-diagnostic-root';
  document.body.appendChild(diagHost);
  createRoot(diagHost).render(
    <StrictMode>
      <DebugDiagnosticPanel
        locationSearch={locationSearch}
        schemeUri={schemeUri}
        gate={gate.attach ? { attach: true } : { attach: false, reason: gate.reason }}
      />
    </StrictMode>,
  );

  // Layers B/C: only proceed when `_deploymentId` + `?debug=1` + a valid `wss:`
  // relay all line up. Otherwise neither the attach nor the overlay happens.
  if (!gate.attach) return;

  // Auto-attach: inject the Chii `target.js` script the moment the gate passes,
  // with no operator click. `maybeAttach` re-uses the gate result we already
  // evaluated, so it is a pure script injection here (idempotent — safe even
  // if called again). The `DebugAttachOverlay` below is then a status-display
  // surface only; the actual relay handshake is wired by this call.
  maybeAttach(gate);

  const { DebugAttachOverlay } = await import('./components/DebugAttachOverlay');
  const token = new URLSearchParams(locationSearch).get('token') ?? '';

  const host = document.createElement('div');
  host.id = 'debug-attach-root';
  document.body.appendChild(host);
  createRoot(host).render(
    <StrictMode>
      <DebugAttachOverlay
        gate={{ relayUrl: gate.relayUrl, deploymentId: gate.deploymentId }}
        initialToken={token}
        maybeAttach={maybeAttach}
        autoAttached
      />
    </StrictMode>,
  );
}
