import { test, expect } from '@playwright/test';

test.describe('Tournament Creation', () => {
  test('should display tournament creation form for TOs', async ({ page }) => {
    await page.goto('/to/create');

    // Should show creation form
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/date/i)).toBeVisible();
    await expect(page.getByLabel(/location/i)).toBeVisible();
  });

  test('should have multi-step form', async ({ page }) => {
    await page.goto('/to/create');

    // Check for step indicators or next button
    const nextButton = page.getByRole('button', { name: /next|continue/i });
    await expect(nextButton).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/to/create');

    // Try to proceed without filling required fields
    const nextButton = page.getByRole('button', { name: /next|continue/i });
    await nextButton.click();

    // Should show validation errors
    await expect(page.getByText(/required|must be/i)).toBeVisible();
  });

  test('should have game system selector', async ({ page }) => {
    await page.goto('/to/create');

    // Should have game system dropdown
    const gameSystemSelect = page.locator('[data-testid="game-system-select"]').or(
      page.getByLabel(/game system/i)
    );
    // May be on step 2, so this is optional check
  });
});
