import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // `phone-tests/*.phone.test.ts` run on a real device via the `run_tests`
    // MCP tool, not in jsdom — there is no device or `window.__sdk` bridge here.
    // The include glob (`src/**`) already excludes the top-level `phone-tests/`
    // dir; this makes that boundary explicit and survives an include change.
    exclude: ['**/node_modules/**', '**/dist/**', 'phone-tests/**'],
  },
});
