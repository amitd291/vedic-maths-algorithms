import { test, expect } from '@playwright/test';

test.describe('Base Method pane (dev server)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Open method menu').click();
    await page.getByRole('tab', { name: /Base Method/ }).click();
  });

  test('renders the 123 ÷ 9 walkthrough', async ({ page }) => {
    await expect(page.getByText('Setup')).toBeVisible();
    await expect(page.locator('.step-counter')).toHaveText('1 / 6');
  });

  test('next advances through to the verified remainder', async ({ page }) => {
    for (let i = 0; i < 5; i++) {
      await page.getByLabel('Next step').click();
    }
    await expect(page.locator('.step-counter')).toHaveText('6 / 6');
    await expect(page.getByText('Verify: 13 × 9 + 6 = 123 ✓')).toBeVisible();
    await expect(page.getByLabel('Next step')).toBeDisabled();
  });

  test('ArrowLeft / ArrowRight keys navigate steps', async ({ page }) => {
    await page.locator('body').focus();

    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.step-counter')).toHaveText('2 / 6');

    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('.step-counter')).toHaveText('1 / 6');
  });

  test('switching back to Dhvajanka restores its own walkthrough', async ({ page }) => {
    await page.getByLabel('Open method menu').click();
    await page.getByRole('tab', { name: /Dhvajanka/ }).click();

    await expect(page.getByLabel('Dividend')).toHaveValue('5428');
    await expect(page.locator('.step-counter')).toHaveText('1 / 6');
  });
});
