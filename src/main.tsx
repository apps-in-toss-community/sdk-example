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
  const { checkDebugGate } = await import('@ait-co/devtools/in-app');
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

  // Layers B/C: only mount the attach overlay when `_deploymentId` + `?debug=1`
  // + a valid `wss:` relay all line up. Otherwise the floating button never
  // renders.
  if (!gate.attach) return;

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
      />
    </StrictMode>,
  );
}
