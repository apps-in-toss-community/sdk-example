import aitDevtools from '@ait-co/devtools/unplugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// 3.0-beta: webViewProps was removed from apps-in-toss.config.ts (renamed from
// granite.config.ts). sdk-example is always a 'partner' WebView — partner
// WebViews have the native chrome drawn outside the viewport, so SDK-reported
// top insets must not be double-applied. Hardcode here; update if the webView
// field is re-introduced in a future config schema.
const webViewType: 'partner' | 'external' | 'game' = 'partner';

export default defineConfig({
  // GitHub Pages project site serves from /<repo-name>/ path.
  // Set BASE_PATH at build time (e.g. BASE_PATH=/sdk-example/) for Pages;
  // defaults to '/' for local dev and 앱인토스 배포.
  base: process.env.BASE_PATH ?? '/',
  define: {
    __WEB_VIEW_TYPE__: JSON.stringify(webViewType),
  },
  plugins: [
    react(),
    tailwindcss(),
    // mcp: true exposes GET/POST /api/ait-devtools/state on the dev server so
    // `devtools-mcp --mode=dev` can read the live browser mock state (the
    // phone-independent half of station 3 debug). The panel POSTs a snapshot
    // on every state change; the MCP stdio server GETs it for the agent.
    aitDevtools.vite({ panel: true, mcp: true, tunnel: !!process.env.AIT_TUNNEL }),
  ],
  // Keep the polyfill and the SDK (plus its transitive bridge/analytics
  // entry points) out of Vite's dep pre-bundle. Otherwise Vite ships the
  // real @apps-in-toss/web-* as pre-bundled modules and the devtools
  // unplugin (which only runs on source resolves) never gets a chance to
  // rewrite them to the mock. Result: the SDK tries to talk to the RN
  // bridge and hangs in a plain browser.
  optimizeDeps: {
    exclude: ['@apps-in-toss/web-framework', '@apps-in-toss/webview-bridge', '@ait-co/polyfill'],
  },
});
