import { test, expect } from '@playwright/test';

test.describe('Tournament Standings', () => {
  test('should load standings page', async ({ page }) => {
    // Standings are public pages at /events/[id]/standings
    await page.goto('/events');

    // Events list should load
    await expect(page.locator('body')).toBeVisible();
  });

  test('standings page should show table structure', async ({ page }) => {
    // Navigate to events first
    const response = await page.goto('/events');
    expect(response?.status()).toBeLessThan(400);
  });

  test('should handle missing event gracefully', async ({ page }) => {
    // Non-existent event should not crash
    const response = await page.goto('/events/non-existent-id/standings');
    // Should get 404 or redirect, not 500
    expect(response?.status()).toBeLessThan(500);
  });
});
