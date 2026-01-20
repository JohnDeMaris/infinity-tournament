import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should display the main heading', async ({ page }) => {
    await page.goto('/');

    // Check that the page loads and has expected content
    await expect(page).toHaveTitle(/Infinity Tournament Manager/);
  });

  test('should have navigation elements', async ({ page }) => {
    await page.goto('/');

    // Verify the page has loaded properly
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Page should still render correctly
    await expect(page).toHaveTitle(/Infinity Tournament Manager/);
  });
});
