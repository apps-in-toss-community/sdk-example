import { expect, test } from '@playwright/test';

test('DemoBanner: toggle expands and collapses in web mode', async ({ page }) => {
  await page.goto('/');

  const toggle = page.getByRole('button', { name: '데모 안내' });
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toContainText('자세히');

  const expandedBody = page.getByText(
    '이 앱은 실제 SDK 동작을 모사하는 mock 레이어 위에서 동작합니다.',
  );
  await expect(expandedBody).toBeHidden();

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(toggle).toContainText('접기');
  await expect(expandedBody).toBeVisible();

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});
