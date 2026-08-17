import { test, expect } from '@playwright/test';

test.describe('walkthrough nav (dev server)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('steps forward through the default problem, disabling nav at each boundary', async ({ page }) => {
    await expect(page.getByLabel('Previous step')).toBeDisabled();
    await expect(page.getByLabel('Next step')).toBeEnabled();

    for (let i = 0; i < 5; i++) {
      await page.getByLabel('Next step').click();
    }
    await expect(page.locator('.step-counter')).toHaveText('6 / 6');
    await expect(page.getByLabel('Next step')).toBeDisabled();
    await expect(page.getByLabel('Previous step')).toBeEnabled();
  });
});
