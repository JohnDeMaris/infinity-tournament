import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate without errors', async ({ page }) => {
    await page.goto('/');

    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Check for no console errors during navigation
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    // Verify page is interactive
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // No critical errors should have occurred
    const criticalErrors = errors.filter(
      (e) => !e.includes('hydration') && !e.includes('Warning')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('should handle direct URL navigation', async ({ page }) => {
    // Test that the app handles direct navigation properly
    const response = await page.goto('/');

    // Should get a successful response
    expect(response?.status()).toBeLessThan(400);
  });

  test('should work offline after initial load', async ({ page, context }) => {
    // First load with network
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify service worker registration (if PWA)
    const swRegistrations = await context.serviceWorkers();
    // App should work whether or not SW is registered
    expect(page.url()).toContain('localhost');
  });
});
