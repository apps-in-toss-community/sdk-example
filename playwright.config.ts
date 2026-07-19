import { defineConfig, devices } from '@playwright/test';

// Allow overriding the dev-server port when another worktree is already
// holding 5173. Setting `PLAYWRIGHT_BASE_URL=http://localhost:5180` (and
// running `pnpm dev --port 5180` separately, or letting webServer spawn it
// on that port) keeps e2e bound to *this* checkout.
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';
const port = new URL(baseURL).port || '5173';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // WebKit은 `engine-probes.spec.ts`(엔진 감응 프로브)에만 쓴다 — UI 회귀
    // 스펙까지 두 엔진으로 돌릴 이유가 없고, webkit 바이너리는 별도 설치
    // (`pnpm exec playwright install webkit`)가 필요해 기본 `pnpm test:e2e`가
    // 미설치 환경에서 깨지면 안 되기 때문이다. 그래서 env-gate로 opt-in한다.
    // 데스크톱 WebKit은 env2(실기기 WebKit)의 근사치일 뿐 대체물이 아니다.
    ...(process.env.AIT_ENGINE_WEBKIT
      ? [
          {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
            testMatch: /engine-probes\.spec\.ts/,
          },
        ]
      : []),
  ],
  webServer: {
    command: `pnpm dev --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
