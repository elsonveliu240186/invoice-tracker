/**
 * Top-level smoke: updated for design system feature (FEAT-20260512-01).
 * Asserts AppShell shell renders, theme toggle reachable, <html class> flips.
 */
import { test, expect } from '@playwright/test';

// Seed an authenticated session so ProtectedRoute lets the app render.
function seedAuth(page: import('@playwright/test').Page) {
  return page.addInitScript(() => {
    localStorage.setItem(
      'it.auth',
      JSON.stringify({
        state: {
          user: {
            email: 'qa@example.com',
            displayName: 'QA User',
            provider: 'password',
            basicAuthToken: btoa('qa@example.com:Secret1!'),
          },
        },
        version: 0,
      }),
    );
  });
}

// Stub the clients list API so /clients renders without a live backend.
function stubClients(page: import('@playwright/test').Page) {
  return page.route('**/api/v1/clients**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 1 }),
    }),
  );
}

test.describe('smoke', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
  });

  test('home page renders', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('home-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();
  });

  test('AppShell nav is present', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible();
  });

  test('ThemeToggle reachable by aria-label; click toggles <html> class', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem('it.theme');
    });
    await page.goto('/');
    await page.waitForSelector('[data-testid="home-page"]');

    const themeBtn = page.getByRole('button', { name: /theme/i });
    await expect(themeBtn).toBeVisible();

    // Switch to dark
    await themeBtn.click();
    await page.getByRole('menuitem', { name: /dark/i }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Switch back to light
    await themeBtn.click();
    await page.getByRole('menuitem', { name: /light/i }).click();
    const cls = await page.evaluate(() => document.documentElement.className);
    expect(cls).not.toContain('dark');
  });

  test('/clients route is navigable via sidebar', async ({ page }) => {
    await stubClients(page);
    await page.goto('/');
    await page.waitForSelector('[data-testid="home-page"]');

    await page
      .getByRole('link', { name: /clients/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/clients/);
    await expect(page.getByTestId('clients-page')).toBeVisible();
  });
});
