/**
 * AC-3: Register form has all fields visible, both password toggles operate
 * independently, and confirmPassword field is properly rendered.
 */
import { test, expect } from '@playwright/test';

test.describe('forms alignment — /register', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
    await page.waitForSelector('h2');
  });

  test('register form renders four input fields', async ({ page }) => {
    // Name, Email, Password, Confirm Password
    const inputs = page.locator('input');
    const count = await inputs.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('confirmPassword field is visible', async ({ page }) => {
    // The confirm password field should be visible
    const confirmInput = page.locator('#reg-confirm-password');
    await expect(confirmInput).toBeVisible();
  });

  test('confirmPassword field starts as type=password', async ({ page }) => {
    const confirmInput = page.locator('#reg-confirm-password');
    await expect(confirmInput).toHaveAttribute('type', 'password');
  });

  test('password field starts as type=password', async ({ page }) => {
    const passwordInput = page.locator('#reg-password');
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('two show/hide toggles exist for password fields', async ({ page }) => {
    // Each PasswordField renders a toggle button
    const toggles = page.locator('button[aria-pressed]');
    const count = await toggles.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('toggling password field does not affect confirmPassword field', async ({ page }) => {
    const passwordInput = page.locator('#reg-password');
    const confirmInput = page.locator('#reg-confirm-password');

    // Both start as password type
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(confirmInput).toHaveAttribute('type', 'password');

    // Click the first toggle (for the password field)
    const toggles = page.locator('button[aria-pressed]');
    await toggles.first().click();

    // Password field should now be text, confirm password still password
    await expect(passwordInput).toHaveAttribute('type', 'text');
    await expect(confirmInput).toHaveAttribute('type', 'password');
  });

  test('toggling confirmPassword field does not affect password field', async ({ page }) => {
    const passwordInput = page.locator('#reg-password');
    const confirmInput = page.locator('#reg-confirm-password');

    // Click the second toggle (for the confirm password field)
    const toggles = page.locator('button[aria-pressed]');
    await toggles.nth(1).click();

    // Confirm password should be text, password still password
    await expect(confirmInput).toHaveAttribute('type', 'text');
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });
});

test.describe('forms alignment — /login', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('h2');
  });

  test('login form renders email and password fields', async ({ page }) => {
    await expect(page.locator('#login-email')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
  });

  test('login form has a submit button', async ({ page }) => {
    const submitBtn = page.getByRole('button', { name: 'Sign in', exact: true });
    await expect(submitBtn).toBeVisible();
  });
});

test.describe('forms alignment — /forgot-password', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('forgot password form renders email field', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.waitForSelector('h2');
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
  });
});
