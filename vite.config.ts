import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import aitDevtools from '@ait-co/devtools/unplugin';

export default defineConfig({
  // GitHub Pages project site serves from /<repo-name>/ path.
  // Set BASE_PATH at build time (e.g. BASE_PATH=/sdk-example/) for Pages;
  // defaults to '/' for local dev and 앱인토스 배포.
  base: process.env.BASE_PATH ?? '/',
  plugins: [
    react(),
    tailwindcss(),
    aitDevtools.vite({ panel: true }),
  ],
});
