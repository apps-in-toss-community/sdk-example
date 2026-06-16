import aitDevtools from '@ait-co/devtools/unplugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages project site serves from /<repo-name>/ path.
  // Set BASE_PATH at build time (e.g. BASE_PATH=/sdk-example/) for Pages;
  // defaults to '/' for local dev and 앱인토스 배포.
  base: process.env.BASE_PATH ?? '/',
  plugins: [
    react(),
    tailwindcss(),
    // mcp: true exposes GET/POST /api/ait-devtools/state on the dev server so
    // `devtools-mcp --mode=dev` can read the live browser mock state (the
    // phone-independent half of station 3 debug). The panel POSTs a snapshot
    // on every state change; the MCP stdio server GETs it for the agent.
    //
    // tunnel: AIT_TUNNEL=1 opens a Cloudflare quick-tunnel so a real phone can
    // load the dev app (환경 2, 실기기 WebKit). Adding AIT_TUNNEL_CDP=1 turns on
    // the on-device CDP relay (tunnel.cdp) — this is what lets the agent observe
    // the live WebKit page (measure_safe_area / list_console_messages 등) AND is
    // the only path that mints the project-local relay TOTP secret (.ait_relay,
    // unplugin ensureRelaySecret). The MCP daemon reads that secret read-only for
    // env-3 intoss relay too, so CDP opt-in is the prerequisite for both env 2's
    // CDP observation and env 3's relay auth. Plain AIT_TUNNEL=1 stays HTTP-only.
    // forceEnable: dog-food 번들(RELEASE_CHANNEL=dogfood, = bundle:ait:dogfood)에서만
    // panel을 production 빌드에 주입해 실기기 토스 앱 WebView(환경 3)에서도 floating
    // button을 띄운다. dev에서는 isDev로 이미 켜지므로 무영향. mock은 끈 채(false 기본,
    // forceEnable+production)라 실 SDK(window.__sdk)가 그대로 동작 — panel은 Storage/
    // Viewport 탭 위주로 의미가 있고, Analytics/상태 탭은 실 SDK↔aitState 브리지가 없어
    // 비어 보이는 게 정상이다. 일반 `bundle:ait`(채널 없음)는 forceEnable이 false라
    // boilerplate 복사자에게 빈 panel을 강요하지 않는다(§Boilerplate 청정성).
    aitDevtools.vite({
      panel: true,
      mcp: true,
      forceEnable: process.env.RELEASE_CHANNEL === 'dogfood',
      tunnel: process.env.AIT_TUNNEL ? { cdp: !!process.env.AIT_TUNNEL_CDP } : false,
    }),
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
