import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import aitDevtools from '@ait-co/devtools/unplugin';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    aitDevtools.vite({ panel: true }),
  ],
});
