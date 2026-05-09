import { expect, test } from '@playwright/test';

test('home: search filter narrows the domain list', async ({ page }) => {
  await page.goto('/');

  const search = page.getByPlaceholder('API 이름으로 검색...');
  await expect(search).toBeVisible();

  await expect(page.getByRole('link', { name: /^IAP/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /^Storage/ })).toBeVisible();

  await search.fill('iap');

  await expect(page.getByRole('link', { name: /^IAP/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /^Storage/ })).toHaveCount(0);
});
