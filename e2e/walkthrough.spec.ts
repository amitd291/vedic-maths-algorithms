import { test, expect } from '@playwright/test';

test.describe('walkthrough nav (dev server)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('back is disabled on the first step', async ({ page }) => {
    await expect(page.getByLabel('Previous step')).toBeDisabled();
    await expect(page.getByLabel('Next step')).toBeEnabled();
  });

  test('next advances the step counter and disables at the last step', async ({ page }) => {
    await page.getByLabel('Next step').click();
    await expect(page.locator('.step-counter')).toHaveText('2 / 6');

    for (let i = 0; i < 4; i++) {
      await page.getByLabel('Next step').click();
    }
    await expect(page.locator('.step-counter')).toHaveText('6 / 6');
    await expect(page.getByLabel('Next step')).toBeDisabled();
    await expect(page.getByLabel('Previous step')).toBeEnabled();
  });

  test('ArrowLeft / ArrowRight keys navigate steps', async ({ page }) => {
    // The page needs focus before Playwright's synthesized key events are
    // delivered; goto() alone doesn't focus it in headless mode.
    await page.locator('body').focus();

    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.step-counter')).toHaveText('2 / 6');

    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('.step-counter')).toHaveText('1 / 6');
  });
});
