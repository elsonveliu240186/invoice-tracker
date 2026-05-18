/**
 * Smoke: auth flow — register → login → dashboard → logout → /login
 */
import { test, expect } from '../fixtures/test';
import { LoginPage } from '../pages/LoginPage';
import { AppShellPage } from '../pages/AppShellPage';

test('register → login → dashboard → logout → /login', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const shell = new AppShellPage(page);

  // Use a unique email for this run
  const email = `smoke-auth-${Date.now()}@e2e.test`;
  const password = 'Secret1!';
  const name = 'Smoke Auth User';

  // Register via UI
  await loginPage.register(email, password, name);

  // Should arrive at dashboard or be redirected to login
  // After registration, navigate to login and sign in
  await loginPage.goto();
  await loginPage.login(email, password);

  // Should be on dashboard
  await expect(page).toHaveURL('/', { timeout: 10000 });
  await expect(page.getByTestId('home-page')).toBeVisible();

  // Logout
  await shell.logout();

  // Should be redirected to /login
  await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
});
