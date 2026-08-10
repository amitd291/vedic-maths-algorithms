import { test, expect } from '@playwright/test';

test.describe('input form (dev server)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads with the default 5428 ÷ 35 problem solved', async ({ page }) => {
    await expect(page.locator('#dividend-input')).toHaveValue('5428');
    await expect(page.locator('#divisor-input')).toHaveValue('35');
    await expect(page.locator('.step-counter')).toHaveText('1 / 6');
  });

  test('rejects an empty dividend and keeps the previous problem on screen', async ({ page }) => {
    await page.locator('#dividend-input').fill('');
    await page.getByRole('button', { name: 'Solve' }).click();

    await expect(page.locator('#dividend-error')).toHaveText('Enter a dividend.');
    await expect(page.locator('#dividend-input')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('.step-counter')).toHaveText('1 / 6');
  });

  test('rejects an empty divisor and keeps the previous problem on screen', async ({ page }) => {
    await page.locator('#divisor-input').fill('');
    await page.getByRole('button', { name: 'Solve' }).click();

    await expect(page.locator('#divisor-error')).toHaveText('Enter a divisor.');
    await expect(page.locator('.step-counter')).toHaveText('1 / 6');
  });

  test('reports both field errors together when both inputs are invalid', async ({ page }) => {
    await page.locator('#dividend-input').fill('10000');
    await page.locator('#divisor-input').fill('5');
    await page.getByRole('button', { name: 'Solve' }).click();

    await expect(page.locator('#dividend-error')).toHaveText('Dividend must be between 1 and 9999.');
    await expect(page.locator('#divisor-error')).toHaveText('Divisor must be a two-digit number (10-99).');
  });

  test('rejects a non-integer dividend', async ({ page }) => {
    await page.locator('#dividend-input').fill('12.5');
    await page.getByRole('button', { name: 'Solve' }).click();

    await expect(page.locator('#dividend-error')).toHaveText('Dividend must be a whole number.');
  });

  test('rejects an out-of-range divisor', async ({ page }) => {
    await page.locator('#divisor-input').fill('100');
    await page.getByRole('button', { name: 'Solve' }).click();

    await expect(page.locator('#divisor-error')).toHaveText('Divisor must be a two-digit number (10-99).');
  });

  test('solving a new valid problem resets to step 1 and clears prior errors', async ({ page }) => {
    await page.locator('#dividend-input').fill('');
    await page.getByRole('button', { name: 'Solve' }).click();
    await expect(page.locator('#dividend-error')).toBeVisible();

    await page.locator('#dividend-input').fill('144');
    await page.locator('#divisor-input').fill('12');
    await page.getByRole('button', { name: 'Solve' }).click();

    await expect(page.locator('#dividend-error')).toHaveCount(0);
    await expect(page.locator('.step-counter')).toHaveText('1 / 4');
  });

  test('accepts boundary values (dividend 1, divisor 99)', async ({ page }) => {
    await page.locator('#dividend-input').fill('1');
    await page.locator('#divisor-input').fill('99');
    await page.getByRole('button', { name: 'Solve' }).click();

    await expect(page.locator('#dividend-error')).toHaveCount(0);
    await expect(page.locator('#divisor-error')).toHaveCount(0);
    await expect(page.locator('.error-banner')).toHaveCount(0);
  });
});
