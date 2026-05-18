/**
 * Regression: auth — wrong password, session persists on refresh, logout clears storage,
 * protected route redirect, /login public route.
 */
import { test, expect } from '../fixtures/test';
import { LoginPage } from '../pages/LoginPage';
import { AppShellPage } from '../pages/AppShellPage';

const ADMIN = {
  email: process.env['E2E_USERNAME'] ?? 'admin@example.com',
  password: process.env['E2E_PASSWORD'] ?? 'Secret1!',
};

test('wrong password shows error toast', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(ADMIN.email, 'WrongPassword999!');
  await expect(loginPage.errorToastLocator()).toBeVisible({ timeout: 5000 });
});

test('session persists on page refresh', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(ADMIN.email, ADMIN.password);
  await expect(page).toHaveURL('/', { timeout: 10000 });

  // Refresh
  await page.reload();
  await expect(page).toHaveURL('/', { timeout: 5000 });
  await expect(page.getByTestId('home-page')).toBeVisible();
});

test('logout clears auth and redirects to /login', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(ADMIN.email, ADMIN.password);
  await expect(page).toHaveURL('/', { timeout: 10000 });

  const shell = new AppShellPage(page);
  await shell.logout();
  await expect(page).toHaveURL(/\/login/, { timeout: 5000 });

  // Try to access protected route — should redirect
  await page.goto('/clients');
  await expect(page).toHaveURL(/\/login/);
});

test('protected route redirects unauthenticated user to /login', async ({ page }) => {
  // Ensure no session
  await page.goto('/clients');
  await expect(page).toHaveURL(/\/login/);
});

test('authenticated user cannot visit /login (bounced to /)', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(ADMIN.email, ADMIN.password);
  await expect(page).toHaveURL('/', { timeout: 10000 });

  await page.goto('/login');
  await expect(page).toHaveURL('/');
});
