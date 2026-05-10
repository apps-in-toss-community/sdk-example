import { expect, test } from '@playwright/test';

test.use({
  permissions: ['clipboard-read', 'clipboard-write'],
});

test('shim-composition: mock-via-polyfill is the default in sdk-example dev', async ({ page }) => {
  await page.goto('/environment');

  const card = page.getByTestId('shim-composition-card');
  await expect(card).toBeVisible();

  const mode = page.getByTestId('shim-composition-mode');
  await expect(mode).toHaveText('mock-via-polyfill');
});

test('shim-composition: writeText round-trip updates devtools mock state', async ({ page }) => {
  await page.goto('/environment');

  await page.getByTestId('shim-composition-card').waitFor();
  await page.getByRole('button', { name: 'writeText round-trip 실행' }).click();

  const status = page.getByTestId('shim-composition-roundtrip');
  await expect(status).toHaveAttribute('data-status', 'ok', { timeout: 5_000 });
  await expect(status).toContainText('devtools mockData.clipboardText === probe');
});
