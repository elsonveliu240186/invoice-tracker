/**
 * Smoke regression — adjacent flows after FEAT-20260516-01 (Expense Tracking)
 *
 * AC-10: Navigating to /clients and /invoices — no regressions
 *
 * Verifies that adding the /expenses route + Expenses sidebar entry has not
 * broken any of the previously-green flows:
 *   - Sidebar now includes an Expenses link
 *   - /clients still renders
 *   - /invoices still renders (stubbed)
 *   - Home dashboard still renders
 *   - Unauthenticated visit to /expenses redirects to /login
 *
 * No live backend required — all API calls are intercepted with page.route().
 */
import { test, expect, type Page } from '@playwright/test';

// ── Auth helpers ──────────────────────────────────────────────────────────────

async function seedAuth(page: Page) {
  await page.addInitScript(() => {
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

async function clearAuth(page: Page) {
  await page.addInitScript(() => {
    localStorage.removeItem('it.auth');
  });
}

// ── API stubs ─────────────────────────────────────────────────────────────────

async function stubDashboard(page: Page) {
  await page.route('**/api/v1/dashboard/stats', (route) =>
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

async function stubClients(page: Page) {
  await page.route('**/api/v1/clients**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 1 }),
    }),
  );
}

async function stubInvoices(page: Page) {
  await page.route('**/api/v1/invoices**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 1 }),
    }),
  );
}

async function stubExpenses(page: Page) {
  // Broad handler registered FIRST; summary-specific handler registered LAST.
  // Playwright matches routes in LIFO order (last-registered wins), so the
  // summary-specific stub takes precedence over the broad one for /summary URLs.
  await page.route('**/api/v1/expenses**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 }),
    }),
  );
  await page.route('**/api/v1/expenses/summary**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ month: '2026-05', grandTotal: 0, totalCount: 0, byCategory: [] }),
    }),
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Smoke regression: adjacent flows unbroken after FEAT-20260516-01', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await stubDashboard(page);
  });

  test('smoke-1: home page still renders after expenses route added', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('dashboard-page')).toBeVisible({ timeout: 10_000 });
  });

  test('smoke-2: sidebar contains an Expenses link', async ({ page }) => {
    await stubExpenses(page);
    await page.goto('/');
    await expect(page.getByTestId('dashboard-page')).toBeVisible({ timeout: 10_000 });

    const nav = page.locator('nav[aria-label="Main navigation"]');
    await expect(nav).toBeVisible();
    await expect(nav.getByRole('link', { name: /expenses/i })).toBeVisible();
  });

  test('smoke-3: /clients route renders without crash', async ({ page }) => {
    await stubClients(page);
    await page.goto('/clients');
    await expect(page.getByTestId('clients-page')).toBeVisible({ timeout: 10_000 });
  });

  test('smoke-4: navigate to /clients via sidebar link', async ({ page }) => {
    await stubClients(page);
    await page.goto('/');
    await expect(page.getByTestId('dashboard-page')).toBeVisible({ timeout: 10_000 });

    await page
      .getByRole('link', { name: /clients/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/clients/);
    await expect(page.getByTestId('clients-page')).toBeVisible({ timeout: 10_000 });
  });

  test('smoke-5: /invoices route renders without crash', async ({ page }) => {
    await stubInvoices(page);
    await page.goto('/invoices');
    // The invoices page should render — look for either the page testid or a heading
    await expect(
      page.getByTestId('invoices-page').or(page.getByRole('heading', { name: /invoice/i })),
    ).toBeVisible({
      timeout: 10_000,
    });
  });

  test('smoke-6: navigate to /invoices via sidebar link', async ({ page }) => {
    await stubInvoices(page);
    await page.goto('/');
    await expect(page.getByTestId('dashboard-page')).toBeVisible({ timeout: 10_000 });

    await page
      .getByRole('link', { name: /invoices/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/invoices/);
  });

  test('smoke-7: unauthenticated visit to /expenses redirects to /login', async ({ page }) => {
    await clearAuth(page);
    await page.goto('/expenses');
    await expect(page).toHaveURL(/\/login/);
  });

  test('smoke-8: /expenses route is navigable via sidebar Expenses link', async ({ page }) => {
    await stubExpenses(page);
    await page.goto('/');
    await expect(page.getByTestId('dashboard-page')).toBeVisible({ timeout: 10_000 });

    await page
      .getByRole('link', { name: /expenses/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/expenses/);
    await expect(page.getByTestId('expenses-page')).toBeVisible({ timeout: 10_000 });
  });
});
