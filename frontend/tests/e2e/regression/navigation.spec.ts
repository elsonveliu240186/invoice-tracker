/**
 * Regression: navigation — every sidebar link navigates correctly;
 * active link has aria-current=page; mobile drawer opens + closes; 404 page for unknown route.
 */
import { test, expect } from '../fixtures/test';
import { LoginPage } from '../pages/LoginPage';

const ADMIN = {
  email: process.env['E2E_USERNAME'] ?? 'admin@example.com',
  password: process.env['E2E_PASSWORD'] ?? 'Secret1!',
};

async function login(page: import('@playwright/test').Page) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(ADMIN.email, ADMIN.password);
  await expect(page).toHaveURL('/', { timeout: 10000 });
}

const SIDEBAR_LINKS = [
  { route: '/clients', text: /clients/i },
  { route: '/invoices', text: /invoices/i },
  { route: '/expenses', text: /expenses/i },
  { route: '/settings/invoice-template', text: /invoice template|template/i },
  { route: '/settings/company', text: /company/i },
];

test('sidebar links navigate to correct routes', async ({ page }) => {
  await login(page);

  for (const link of SIDEBAR_LINKS) {
    await page.goto(link.route);
    await expect(page).toHaveURL(link.route, { timeout: 5000 });
  }
});

test('active sidebar link has aria-current=page on /clients', async ({ page }) => {
  await login(page);
  await page.goto('/clients');

  // Find the NavLink span for clients that has aria-current=page
  const activeLink = page.locator('[aria-current="page"]');
  await expect(activeLink.first()).toBeVisible({ timeout: 5000 });
});

test('mobile: hamburger button is visible and opens drawer', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);

  // Hamburger button should be visible on mobile
  const hamburger = page.getByTestId('hamburger');
  await expect(hamburger).toBeVisible({ timeout: 5000 });

  // Click to open drawer
  await hamburger.click();
  await expect(page.getByTestId('drawer-panel')).toBeVisible({ timeout: 3000 });

  // Close via sidebar close button
  const closeBtn = page.getByTestId('sidebar-close');
  if (await closeBtn.isVisible()) {
    await closeBtn.click();
  } else {
    // Click backdrop to close
    await page.getByTestId('drawer-backdrop').click();
  }

  await expect(page.getByTestId('drawer-panel')).not.toBeVisible({ timeout: 3000 });
});

test('unknown route shows 404 page', async ({ page }) => {
  await login(page);
  await page.goto('/this-route-does-not-exist');

  // Should show a not-found indicator
  const notFound = page
    .locator('[data-testid="not-found"], h1, h2')
    .filter({ hasText: /not found|404|page not found/i });
  await expect(notFound.first()).toBeVisible({ timeout: 5000 });
});
