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

// Dev-only: expose the SDK bridge so the devtools MCP `call_sdk` tool can
// drive the mock SDK over a local-browser CDP attach (env 1, plain `pnpm dev`).
// In a dev build `@apps-in-toss/web-framework` resolves to the devtools mock
// via the unplugin alias — exactly the SDK surface env-1 debugging wants to
// exercise. Release builds DCE this via `import.meta.env.DEV === false`.
if (import.meta.env.DEV) {
  void import('./debug/sdkBridge').then((m) => m.installSdkBridge());
}
