import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // `.ait.test.ts` 슈트는 SDK 표면을 import해 실제로 호출한다. dev에선
    // devtools unplugin이 `@apps-in-toss/web-framework`를 mock으로 rewrite하지만
    // 그 unplugin은 vitest에서 돌지 않으므로(Vite dev/build 전용), vitest에서는
    // 이 alias로 같은 swap을 재현한다 — env1(mock) 셀이 폰 없이 도는 근거.
    // 기존 컴포넌트 smoke 테스트는 SDK를 직접 import하지 않으므로 이 alias의
    // 영향을 받지 않는다(green 유지).
    alias: {
      '@apps-in-toss/web-framework': '@ait-co/devtools/mock',
    },
  },
});
