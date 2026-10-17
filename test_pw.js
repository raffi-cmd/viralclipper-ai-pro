import { test, expect } from '@playwright/test';

test.describe('ViralClipper AI Pro E2E Verification', () => {
  test('Page loads and elements exist', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await expect(page.locator('text=ViralClipper')).toBeVisible();
  });
});
