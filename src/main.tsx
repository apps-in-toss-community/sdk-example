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
  void mountDebugAttachOverlay();
}

async function mountDebugAttachOverlay(): Promise<void> {
  const { checkDebugGate } = await import('@ait-co/devtools/in-app');
  const gate = checkDebugGate();
  // Layers B/C: only mount when `_deploymentId` + `?debug=1` + a valid `wss:`
  // relay all line up. Otherwise the floating button never renders.
  if (!gate.attach) return;

  const { DebugAttachOverlay } = await import('./components/DebugAttachOverlay');
  const token = new URLSearchParams(window.location.search).get('token') ?? '';

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
