import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'aitc-sdk-example',
  brand: {
    displayName: 'AITC SDK 예제',
    primaryColor: '#3182F6',
    icon: 'https://sdk-example.aitc.dev/og/og-image.png',
  },
  web: {
    host: 'localhost',
    port: 5173,
    commands: {
      dev: 'vite',
      build: 'vite build',
    },
  },
  permissions: [],
  outdir: 'dist',
});
