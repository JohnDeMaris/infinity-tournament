import { test, expect } from '@playwright/test';

test.describe('User Registration', () => {
  test('should display registration form', async ({ page }) => {
    await page.goto('/register');

    // Check form elements exist
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /register|sign up/i })).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/register');

    // Try to submit empty form
    await page.getByRole('button', { name: /register|sign up/i }).click();

    // Should show validation errors
    await expect(page.getByText(/required|invalid/i)).toBeVisible();
  });

  test('should show error for invalid email', async ({ page }) => {
    await page.goto('/register');

    await page.getByLabel(/email/i).fill('notanemail');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /register|sign up/i }).click();

    // Should show email error
    await expect(page.getByText(/valid email|invalid email/i)).toBeVisible();
  });

  test('should show error for short password', async ({ page }) => {
    await page.goto('/register');

    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('123');
    await page.getByRole('button', { name: /register|sign up/i }).click();

    // Should show password length error
    await expect(page.getByText(/password|characters/i)).toBeVisible();
  });

  test('should have link to login page', async ({ page }) => {
    await page.goto('/register');

    const loginLink = page.getByRole('link', { name: /login|sign in|already have/i });
    await expect(loginLink).toBeVisible();
  });
});
