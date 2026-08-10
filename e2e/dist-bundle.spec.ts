import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const distIndex = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'dist',
  'index.html',
);

test('offline dist/index.html loads over file://', async ({ page }) => {
  await page.goto(`file://${distIndex}`);
  await expect(page.getByRole('heading', { name: 'Dhvajanka Division' })).toBeVisible();
  await page.screenshot({ path: 'e2e/screenshots/dist-bundle.png', fullPage: true });
});
