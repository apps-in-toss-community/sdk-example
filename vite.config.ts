import aitDevtools from '@ait-co/devtools/unplugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import graniteConfig from './granite.config';

// granite.config.ts 의 webViewProps.type 을 build-time 상수로 노출.
// partner WebView 는 토스 native chrome 이 viewport 밖에 그려져 SDK 가
// 보고하는 top inset 을 padding 으로 적용하면 중복 공간이 생기고,
// game/external 은 chrome 이 WebView 안 overlay 라 그대로 적용해야 한다.
// 이 차이를 client 코드가 알 수 있도록 build-time 에 박아둔다.
const webViewType = (graniteConfig.webViewProps?.type ?? 'partner') as
  | 'partner'
  | 'external'
  | 'game';

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
    exclude: [
      '@apps-in-toss/web-framework',
      '@apps-in-toss/web-bridge',
      '@apps-in-toss/web-analytics',
      '@ait-co/polyfill',
    ],
  },
});
