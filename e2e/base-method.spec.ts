import { test, expect } from '@playwright/test';

test.describe('Base Method pane (dev server)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Open method menu').click();
    await page.getByRole('tab', { name: /Base Method/ }).click();
  });

  test('renders the 10030 ÷ 827 walkthrough and steps through to the verified remainder', async ({ page }) => {
    await expect(page.getByText('Setup')).toBeVisible();
    await expect(page.locator('.step-counter')).toHaveText('1 / 7');

    for (let i = 1; i < 7; i++) {
      await page.getByLabel('Next step').click();
    }
    await expect(page.locator('.step-counter')).toHaveText('7 / 7');
    await expect(page.getByText('Verify: 12 × 827 + 106 = 10030 ✓')).toBeVisible();
    await expect(page.getByLabel('Next step')).toBeDisabled();
  });

  test('switching back to Dhvajanka restores its own walkthrough', async ({ page }) => {
    await page.getByLabel('Open method menu').click();
    await page.getByRole('tab', { name: /Dhvajanka/ }).click();

    await expect(page.getByLabel('Dividend')).toHaveValue('5428');
    await expect(page.locator('.step-counter')).toHaveText('1 / 6');
  });
});
