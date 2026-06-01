import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'aitc-sdk-example',
  brand: {
    primaryColor: '#3182F6',
  },
  webBundleDir: 'dist',
  permissions: [
    { name: 'camera', access: 'access' },
    { name: 'clipboard', access: 'read' },
    { name: 'clipboard', access: 'write' },
    { name: 'contacts', access: 'read' },
    { name: 'geolocation', access: 'access' },
    { name: 'microphone', access: 'access' },
    { name: 'photos', access: 'read' },
  ],
});
