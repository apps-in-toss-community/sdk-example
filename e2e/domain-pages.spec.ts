import { expect, test } from '@playwright/test';

const pages = [
  { path: '/iap', heading: 'IAP' },
  { path: '/storage', heading: 'Storage' },
  { path: '/clipboard', heading: 'Clipboard' },
] as const;

for (const { path, heading } of pages) {
  test(`domain page renders heading: ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
  });
}
