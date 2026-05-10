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
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `pnpm dev --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
