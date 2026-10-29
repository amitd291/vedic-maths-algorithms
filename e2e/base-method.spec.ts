import { test, expect, type Page } from '@playwright/test';

async function solve(page: Page, dividend: number, divisor: number) {
  await page.locator('#base-dividend-input').fill(String(dividend));
  await page.locator('#base-divisor-input').fill(String(divisor));
  await page.getByRole('button', { name: 'Solve' }).click();
}

test.describe('Base Method pane (dev server)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Open method menu').click();
    await page.getByRole('tab', { name: /Base Method/ }).click();
  });

  test('renders the 10600 ÷ 87 walkthrough and steps through to the verified remainder', async ({ page }) => {
    await solve(page, 10600, 87);
    await expect(page.getByText('Setup')).toBeVisible();
    await expect(page.locator('.step-counter')).toHaveText('1 / 10');

    for (let i = 1; i < 9; i++) {
      await page.getByLabel('Next step').click();
    }
    await expect(page.locator('.step-counter')).toHaveText('9 / 10');
    await expect(page.locator('.carry-chip.show')).toHaveText(['+ 1', '− 10']);
    await expect(page.locator('.carry-connector.show')).toBeVisible();

    await page.getByLabel('Next step').click();
    await expect(page.locator('.step-counter')).toHaveText('10 / 10');
    await expect(page.locator('.carry-chip.show')).toHaveCount(0);
    await expect(page.getByText('Verify: 121 × 87 + 73 = 10600 ✓')).toBeVisible();
    await expect(page.getByLabel('Next step')).toBeDisabled();
  });

  test('switching back to Dhvajanka restores its own walkthrough', async ({ page }) => {
    await page.getByLabel('Open method menu').click();
    await page.getByRole('tab', { name: /Dhvajanka/ }).click();

    await expect(page.getByLabel('Dividend')).toHaveValue('5428');
    await expect(page.locator('.step-counter')).toHaveText('1 / 6');
  });

  test('shows a borrow (negative carry) with reversed chip signs and arrow, no compare-and-correct step (14189 ÷ 102)', async ({ page }) => {
    await solve(page, 14189, 102);
    await expect(page.locator('.step-counter')).toHaveText('1 / 9');

    for (let i = 1; i < 8; i++) {
      await page.getByLabel('Next step').click();
    }
    await expect(page.locator('.step-counter')).toHaveText('8 / 9');
    await expect(page.getByText('sum the RHS columns')).toBeVisible();
    await expect(page.getByText('compare and correct')).toHaveCount(0);
    await expect(page.locator('.carry-chip.show')).toHaveText(['− 1', '+ 10']);
    const arrowLine = page.locator('.carry-connector.show line');
    await expect(arrowLine).toHaveAttribute('x1', '6');

    await page.getByLabel('Next step').click();
    await expect(page.locator('.step-counter')).toHaveText('9 / 9');
    await expect(page.locator('.carry-chip.show')).toHaveCount(0);
  });

  test('flips sign for a negative (Paravartya) difference and merges an over-width remainder (1693 ÷ 131)', async ({ page }) => {
    await solve(page, 1693, 131);
    await expect(page.locator('.divisor-digit-diff')).toHaveText('-31');
    await expect(page.locator('.step-counter')).toHaveText('1 / 7');

    for (let i = 1; i < 7; i++) {
      await page.getByLabel('Next step').click();
    }
    await expect(page.locator('.step-counter')).toHaveText('7 / 7');
    await expect(page.getByText('compare and correct')).toBeVisible();
    await expect(page.getByText('Verify: 12 × 131 + 121 = 1693 ✓')).toBeVisible();

    const totals = page.locator('.total-slot.show.done');
    await expect(totals).toHaveCount(3);
    await expect(totals.last()).toHaveText('121');
  });

  test('scales the divisor via a chosen candidate, then descales back to the original answer (5428 ÷ 35)', async ({ page }) => {
    await solve(page, 5428, 35);
    await expect(page.locator('.divisor-digit-diff')).toHaveText('—');

    // Default state, before any selection: expanded, plain question text, no highlight.
    await expect(page.getByText('How should this be simplified?')).toBeVisible();
    await expect(page.getByRole('button', { name: /^105: Scaled divisor/ })).toBeVisible();
    await expect(page.locator('.simplification-option.selected')).toHaveCount(0);

    await page.getByRole('button', { name: /^105: Scaled divisor/ }).click();
    await expect(page.locator('.divisor-digit-diff')).toHaveText('-5');
    await expect(page.getByText('Setup')).toBeVisible();

    while (await page.getByLabel('Next step').isEnabled()) {
      await page.getByLabel('Next step').click();
    }
    await expect(page.getByText('Descale the answer')).toBeVisible();
    // '155 | 3' now appears twice by design: the .descale-row inside the board
    // (asserted below) and the ordinary result chip in the step panel.
    await expect(page.locator('.step-panel').getByText('155 | 3')).toBeVisible();
    await expect(page.getByText('Verify: 155 × 35 + 3 = 5428 ✓')).toBeVisible();

    // Assert descale-row is visible and positioned inside the digit-board (above step-panel)
    await expect(page.locator('.digit-board-cols .descale-row')).toBeVisible();
    await expect(page.locator('.digit-board-cols .descale-row')).toContainText('Real answer (÷ 35)');

    const descaleRowBox = await page.locator('.digit-board-cols .descale-row').boundingBox();
    const stepPanelBox = await page.locator('.step-panel').boundingBox();
    expect(descaleRowBox).not.toBeNull();
    expect(stepPanelBox).not.toBeNull();
    expect(descaleRowBox!.y).toBeLessThan(stepPanelBox!.y);

    await page.getByText(/✓ 105: Scaled divisor/).click();

    // Re-expanded: the previously chosen ×3 card is still visibly selected (green).
    await expect(page.getByRole('button', { name: /^105: Scaled divisor/ })).toHaveClass(/\bselected\b/);
    await expect(page.locator('.simplification-option.selected')).toHaveCount(1);
  });

  test('shrinks the result-chip font size under the 400px mobile breakpoint', async ({ page }) => {
    await solve(page, 10600, 87);
    for (let i = 1; i < 10; i++) {
      await page.getByLabel('Next step').click();
    }
    await expect(page.locator('.step-counter')).toHaveText('10 / 10');

    await page.setViewportSize({ width: 500, height: 800 });
    await expect(page.locator('.ch').first()).toHaveCSS('font-size', '15px');

    await page.setViewportSize({ width: 375, height: 800 });
    await expect(page.locator('.ch').first()).toHaveCSS('font-size', '13px');
  });
});
