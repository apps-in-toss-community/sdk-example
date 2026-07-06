import { defineConfig } from '@apps-in-toss/web-framework/config';

// 3.x cell: granite.config.ts → apps-in-toss.config.ts (파일명은 3.0-beta CLI가
// config discovery에 요구하는 이름). 스키마도 축소됐다 — `brand.displayName`/`icon`,
// `web{}` 블록, `outdir`(→`webBundleDir`)이 3.0-beta AppsInTossConfig에 없다.
export default defineConfig({
  appName: 'aitc-sdk-example',
  brand: {
    primaryColor: '#3182F6',
  },
  permissions: [
    { name: 'camera', access: 'access' },
    { name: 'clipboard', access: 'read' },
    { name: 'clipboard', access: 'write' },
    { name: 'contacts', access: 'read' },
    { name: 'geolocation', access: 'access' },
    { name: 'microphone', access: 'access' },
    { name: 'photos', access: 'read' },
  ],
  webBundleDir: 'dist',
});
