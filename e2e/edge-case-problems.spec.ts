import { test, expect } from '@playwright/test';
import { computeSteps } from '../src/lib/computeSteps';

const cases = [
  { dividend: 5, divisor: 12, label: 'divisor greater than dividend' },
  { dividend: 4900, divisor: 35, label: 'exact division (zero remainder)' },
  { dividend: 1015, divisor: 99, label: 'leading-zero quotient digit' },
  { dividend: 5428, divisor: 35, label: 'quotient-digit adjustment/backtrack' },
];

test.describe('edge case problems (dev server)', () => {
  for (const { dividend, divisor, label } of cases) {
    test(`${label}: ${dividend} ÷ ${divisor} matches computeSteps`, async ({ page }) => {
      const steps = computeSteps(dividend, divisor);
      const last = steps[steps.length - 1];

      await page.goto('/');
      await page.locator('#dividend-input').fill(String(dividend));
      await page.locator('#divisor-input').fill(String(divisor));
      await page.getByRole('button', { name: 'Solve' }).click();

      await expect(page.locator('.error-banner')).toHaveCount(0);
      await expect(page.locator('.step-counter')).toHaveText(`1 / ${steps.length}`);

      for (let i = 1; i < steps.length; i++) {
        await page.getByLabel('Next step').click();
      }
      await expect(page.locator('.step-counter')).toHaveText(`${steps.length} / ${steps.length}`);
      await expect(page.getByLabel('Next step')).toBeDisabled();

      const quotientSlots = page.locator('.quotient-slot');
      await expect(quotientSlots).toHaveCount(last.quotientDigits.length + 1);

      for (let i = 0; i < last.quotientDigits.length; i++) {
        const value = last.quotientDigits[i];
        await expect(quotientSlots.nth(i)).toHaveText(value === null ? `Q${i + 1}` : String(value));
      }
      await expect(quotientSlots.nth(last.quotientDigits.length)).toHaveText(String(last.r));

      const verifyText = last.lines.find((l) => l.kind === 'note' && l.tone === 'success')?.text;
      await expect(page.locator('.success-note')).toHaveText(verifyText!);
    });
  }

  test('the raw step shows the lookahead note and the adjusted step shows the reduction note', async ({
    page,
  }) => {
    const steps = computeSteps(5428, 35);
    const rawNote = steps[2].lines.find((l) => l.kind === 'note' && l.tone === 'warn')?.text;
    const adjustedNote = steps[3].lines.find((l) => l.kind === 'note' && l.tone === 'warn')?.text;
    expect(rawNote).toBeDefined();
    expect(adjustedNote).toBeDefined();

    await page.goto('/');
    await page.getByLabel('Next step').click();
    await page.getByLabel('Next step').click();

    const activeWarnNote = page.locator('[aria-hidden="false"] .warn-note');

    await expect(page.locator('.step-counter')).toHaveText('3 / 6');
    await expect(activeWarnNote).toHaveText(rawNote!);

    await page.getByLabel('Next step').click();

    await expect(page.locator('.step-counter')).toHaveText('4 / 6');
    await expect(activeWarnNote).toHaveText(adjustedNote!);
  });
});
