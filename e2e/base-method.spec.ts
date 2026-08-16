import { test, expect } from '@playwright/test';
import { computeBaseMethodSteps } from '../src/lib/computeBaseMethodSteps';

const DIVIDEND = 10030;
const DIVISOR = 827;
const steps = computeBaseMethodSteps(DIVIDEND, DIVISOR);

test.describe('Base Method pane (dev server)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Open method menu').click();
    await page.getByRole('tab', { name: /Base Method/ }).click();
  });

  test(`renders the ${DIVIDEND} ÷ ${DIVISOR} walkthrough`, async ({ page }) => {
    await expect(page.getByText('Setup')).toBeVisible();
    await expect(page.locator('.step-counter')).toHaveText(`1 / ${steps.length}`);
  });

  test('next advances through to the verified remainder', async ({ page }) => {
    for (let i = 1; i < steps.length; i++) {
      await page.getByLabel('Next step').click();
    }
    await expect(page.locator('.step-counter')).toHaveText(`${steps.length} / ${steps.length}`);
    const verifyText = steps[steps.length - 1].lines.find((l) => l.kind === 'note' && l.tone === 'success')?.text;
    await expect(page.getByText(verifyText!)).toBeVisible();
    await expect(page.getByLabel('Next step')).toBeDisabled();
  });

  test('ArrowLeft / ArrowRight keys navigate steps', async ({ page }) => {
    await page.locator('body').focus();

    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.step-counter')).toHaveText(`2 / ${steps.length}`);

    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('.step-counter')).toHaveText(`1 / ${steps.length}`);
  });

  test('switching back to Dhvajanka restores its own walkthrough', async ({ page }) => {
    await page.getByLabel('Open method menu').click();
    await page.getByRole('tab', { name: /Dhvajanka/ }).click();

    await expect(page.getByLabel('Dividend')).toHaveValue('5428');
    await expect(page.locator('.step-counter')).toHaveText('1 / 6');
  });

  test('sums the RHS columns right-to-left in the explainer text, carry first', async ({ page }) => {
    const sumStepIndex = steps.findIndex((s) => s.title.includes('sum the RHS columns'));
    for (let i = 0; i < sumStepIndex; i++) {
      await page.getByLabel('Next step').click();
    }
    await expect(page.locator('.step-counter')).toHaveText(`${sumStepIndex + 1} / ${steps.length}`);

    const sumLines = steps[sumStepIndex].lines.filter((l) => l.kind === 'calc' && l.label.startsWith('Sum column'));
    const labels = page.locator('[aria-hidden="false"] .calc-line .co');
    for (let i = 0; i < sumLines.length; i++) {
      await expect(labels.nth(i)).toHaveText(sumLines[i].label);
    }
    // Rightmost column first, so the carry into column 3 is already on screen
    // by the time its own "(with carry)" line explains it.
    expect(sumLines.map((l) => l.label)).toEqual(['Sum column 5', 'Sum column 4', 'Sum column 3 (with carry)']);
  });

  test("Q2's multiply lands its contribution chips on the same row across every column it reaches", async ({
    page,
  }) => {
    const multiplyStepIndex = steps.findIndex((s) => s.title.includes('multiply Q₂'));
    for (let i = 0; i < multiplyStepIndex; i++) {
      await page.getByLabel('Next step').click();
    }
    await expect(page.locator('.step-counter')).toHaveText(`${multiplyStepIndex + 1} / ${steps.length}`);

    const cols = page.locator('.board-col');
    // Column 3 and column 4 (0-indexed 2, 3) already held Q1's contribution
    // on row 0; Q2's contribution should land as their second chip (row 1).
    await expect(cols.nth(2).locator('.contribution-chip').nth(1)).toHaveText('+1');
    await expect(cols.nth(3).locator('.contribution-chip').nth(1)).toHaveText('+7');

    // Column 5 (0-indexed 4) is only ever reached by Q2 — its lone chip must
    // still land on row 1 (not float up to row 0), keeping it aligned with
    // columns 3 and 4's row-1 chip from this same multiply step.
    const col5Chips = cols.nth(4).locator('.contribution-chip');
    await expect(col5Chips).toHaveCount(2);
    await expect(col5Chips.nth(0)).toHaveClass(/placeholder/);
    await expect(col5Chips.nth(1)).not.toHaveClass(/placeholder/);
    await expect(col5Chips.nth(1)).toHaveText('+3');
  });
});
