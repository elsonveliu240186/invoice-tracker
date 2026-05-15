/**
 * Smoke-regression spec: exercises the most-trafficked adjacent flow (/clients)
 * to catch regressions introduced by the design system feature.
 * AC-4: app renders without errors; AC-11: ClientsPage works within AppShell.
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

// Stub dashboard stats so the dashboard page renders without errors.
function stubDashboardStats(page: import('@playwright/test').Page) {
  return page.route('**/api/v1/dashboard/stats', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        totalInvoices: 0,
        draftCount: 0,
        sentCount: 0,
        paidCount: 0,
        totalRevenue: 0,
        paidRevenue: 0,
        pendingRevenue: 0,
        revenueByMonth: [],
      }),
    }),
  );
}

test.describe('smoke regression — clients flow', () => {
  test.use({ viewport: { width: 1280, height: 800 } });
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await stubClients(page);
    await stubDashboardStats(page);
  });

  test('app loads at / without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    await page.waitForSelector('[data-testid="dashboard-page"]');

    expect(errors).toHaveLength(0);
  });

  test('AppShell renders TopNav and Sidebar on home page', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="dashboard-page"]');

    // TopNav header bar
    await expect(page.locator('header')).toBeVisible();

    // Sidebar
    await expect(page.getByTestId('desktop-sidebar')).toBeVisible();

    // ThemeToggle in TopNav
    await expect(page.getByRole('button', { name: /theme/i })).toBeVisible();
  });

  test('navigate to /clients — page renders inside AppShell', async ({ page }) => {
    await page.goto('/clients');
    await page.waitForSelector('[data-testid="clients-page"]');

    // AppShell wrapper still present
    await expect(page.getByTestId('desktop-sidebar')).toBeVisible();
    await expect(page.locator('header')).toBeVisible();

    // Clients page header
    await expect(page.getByRole('heading', { name: /clients/i })).toBeVisible();
  });

  test('New client button opens the client form sheet', async ({ page }) => {
    await page.goto('/clients');
    await page.waitForSelector('[data-testid="clients-page"]');

    await page.getByTestId('btn-new-client').click();

    // Sheet (slide-over) should open — SheetContent renders as a dialog role
    await expect(page.getByTestId('client-form-sheet')).toBeVisible();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('client form sheet can be closed', async ({ page }) => {
    await page.goto('/clients');
    await page.waitForSelector('[data-testid="clients-page"]');

    await page.getByTestId('btn-new-client').click();
    await expect(page.getByTestId('client-form-sheet')).toBeVisible();

    // Close button inside the sheet
    await page.getByTestId('sheet-close').click();
    await expect(page.getByTestId('client-form-sheet')).not.toBeVisible();
  });

  test('search input is visible and accepts input', async ({ page }) => {
    await page.goto('/clients');
    await page.waitForSelector('[data-testid="clients-page"]');

    const searchInput = page.getByTestId('search-input');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('test');
    await expect(searchInput).toHaveValue('test');
  });

  test('sidebar Clients link navigates to /clients from dashboard', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="dashboard-page"]');

    await page
      .getByRole('link', { name: /clients/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/clients/);
    await expect(page.getByTestId('clients-page')).toBeVisible();
  });

  test('404 route renders not-found fallback without crashing', async ({ page }) => {
    await page.goto('/does-not-exist');

    // AppShell still renders
    await expect(page.locator('header')).toBeVisible();

    // Some not-found message visible
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toContain('Page not found');
  });

  test('back navigation from /clients to / works', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="dashboard-page"]');

    await page.goto('/clients');
    await page.waitForSelector('[data-testid="clients-page"]');

    await page.goBack();
    await expect(page).toHaveURL('/');
    await expect(page.getByTestId('dashboard-page')).toBeVisible();
  });
});
