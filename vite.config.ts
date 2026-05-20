import aitDevtools from '@ait-co/devtools/unplugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages project site serves from /<repo-name>/ path.
  // Set BASE_PATH at build time (e.g. BASE_PATH=/sdk-example/) for Pages;
  // defaults to '/' for local dev and 앱인토스 배포.
  base: process.env.BASE_PATH ?? '/',
  // Build-time channel flag for the in-app debug surface (Layer A of the
  // 3-layer gate). Only a `RELEASE_CHANNEL=dogfood` build inlines `true`,
  // which lets the bundler keep the `@ait-co/devtools/in-app` dynamic import
  // and the floating attach UI. Every other build (dev, preview, release,
  // tests) inlines `false`, so the whole debug path is dead-code-eliminated.
  define: {
    __DEBUG_BUILD__: JSON.stringify(process.env.RELEASE_CHANNEL === 'dogfood'),
  },
  // Verification escape hatch: the in-app debug gate (`@ait-co/devtools/in-app`)
  // landed on devtools `main` after the 0.1.22 npm publish, so the installed
  // package has no `/in-app` subpath yet. Point `AIT_DEBUG_INAPP_SRC` at a
  // local devtools `src/in-app/index.ts` to alias the dynamic import for
  // dogfood-channel verification before a devtools release ships the entry.
  // Unset (the default) leaves the bare `@ait-co/devtools/in-app` specifier so
  // the real dogfood `.ait` bundle consumes the published package.
  resolve: process.env.AIT_DEBUG_INAPP_SRC
    ? { alias: { '@ait-co/devtools/in-app': process.env.AIT_DEBUG_INAPP_SRC } }
    : undefined,
  plugins: [
    react(),
    tailwindcss(),
    aitDevtools.vite({ panel: true, tunnel: !!process.env.AIT_TUNNEL }),
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
