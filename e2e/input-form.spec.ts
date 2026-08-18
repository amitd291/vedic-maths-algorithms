import { test, expect } from '@playwright/test';

test.describe('input form (dev server)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Open method menu').click();
    await page.getByRole('tab', { name: /Dhvajanka/ }).click();
  });

  test('solving a new valid problem replaces the walkthrough', async ({ page }) => {
    await expect(page.locator('.step-counter')).toHaveText('1 / 6');

    await page.locator('#dividend-input').fill('144');
    await page.locator('#divisor-input').fill('12');
    await page.getByRole('button', { name: 'Solve' }).click();

    await expect(page.locator('.error-banner')).toHaveCount(0);
    await expect(page.locator('.step-counter')).toHaveText('1 / 4');
  });

  test('rejects invalid input inline and keeps the previous problem on screen', async ({ page }) => {
    await page.locator('#dividend-input').fill('');
    await page.getByRole('button', { name: 'Solve' }).click();

    await expect(page.locator('#dividend-error')).toHaveText('Enter a dividend.');
    await expect(page.locator('#dividend-input')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('.step-counter')).toHaveText('1 / 6');
  });
});
