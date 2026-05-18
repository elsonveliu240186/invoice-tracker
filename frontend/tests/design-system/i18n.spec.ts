/**
 * AC-8: i18n bootstraps; English strings render (not raw keys like `common.appName`).
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

// Stub the dashboard APIs so DashboardPage renders without a live backend.
function stubDashboard(page: import('@playwright/test').Page) {
  const statsBody = JSON.stringify({
    totalInvoices: 0,
    draftCount: 0,
    totalRevenue: 0,
    paidCount: 0,
    paidRevenue: 0,
    sentCount: 0,
    pendingRevenue: 0,
    revenueByMonth: [],
  });
  const expenseBody = JSON.stringify({ expenseByMonth: [], expenseByCategory: [] });
  void page.route('**/api/v1/dashboard/stats**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: statsBody }),
  );
  return page.route('**/api/v1/dashboard/expense-stats**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: expenseBody }),
  );
}

test.describe('i18n — English strings', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await stubClients(page);
    await stubDashboard(page);
  });

  test('AC-8: app name renders as "Invoice Tracker" not raw key', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="home-page"]');

    // The sidebar header and/or TopNav avatar text should show "Invoice Tracker"
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).not.toContain('common.appName');
    expect(bodyText).toContain('Invoice Tracker');
  });

  test('AC-8: nav labels render as English words not translation keys', async ({ page }) => {
    await stubClients(page);
    await page.goto('/');
    await page.waitForSelector('[data-testid="home-page"]');

    const bodyText = await page.locator('body').textContent();
    expect(bodyText).not.toMatch(/nav\.(dashboard|clients|invoices)/);
    expect(bodyText).toContain('Dashboard');
    expect(bodyText).toContain('Clients');
    expect(bodyText).toContain('Invoices');
  });

  test('AC-8: home page title renders from i18n key', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="home-page"]');

    // DashboardPage shows a welcome banner h1: "Welcome back, {name}"
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  });

  test('AC-8: home page welcome banner subtitle renders English text', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="welcome-banner"]');

    // Verify the subtitle is translated (not a raw i18n key)
    const banner = page.getByTestId('welcome-banner');
    const bannerText = await banner.textContent();
    expect(bannerText).not.toContain('dashboard.welcome');
    expect(bannerText).toContain('Welcome back');
  });

  test('AC-8: clients page header renders English title', async ({ page }) => {
    await stubClients(page);
    await page.goto('/clients');
    await page.waitForSelector('[data-testid="clients-page"]');

    const bodyText = await page.locator('body').textContent();
    expect(bodyText).not.toContain('clients.title');
    expect(bodyText).toContain('Clients');
  });

  test('AC-8: no raw i18n keys visible anywhere on home page', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="home-page"]');

    const bodyText = await page.locator('body').textContent();
    // Keys use dot notation — none should be visible as-is
    expect(bodyText).not.toMatch(/\b(common|nav|home|clients|errors)\.\w+/);
  });
});
