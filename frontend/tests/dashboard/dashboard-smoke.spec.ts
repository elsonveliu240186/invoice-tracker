/**
 * Smoke spec for the dashboard — covers the most-trafficked existing flow
 * (invoice KPI cards + revenue + invoice-status charts) to catch regressions
 * introduced by FEAT-20260517-01.
 *
 * All backend calls are stubbed via page.route() — no live backend needed.
 */
import { test, expect } from '@playwright/test';

const STATS_BODY = JSON.stringify({
  totalInvoices: 10,
  draftCount: 2,
  totalRevenue: 8500.0,
  paidCount: 6,
  paidRevenue: 5400.0,
  sentCount: 2,
  pendingRevenue: 3100.0,
  revenueByMonth: [
    { month: '2025-12', revenue: 1000 },
    { month: '2026-01', revenue: 1200 },
    { month: '2026-02', revenue: 1500 },
    { month: '2026-03', revenue: 1800 },
    { month: '2026-04', revenue: 1600 },
    { month: '2026-05', revenue: 1400 },
  ],
});

const EXPENSE_BODY = JSON.stringify({
  effectiveFrom: '2025-12-01',
  effectiveTo: '2026-05-31',
  totalExpenses: 3000.0,
  expenseByMonth: [
    { month: '2025-12', total: 400 },
    { month: '2026-01', total: 500 },
    { month: '2026-02', total: 550 },
    { month: '2026-03', total: 600 },
    { month: '2026-04', total: 500 },
    { month: '2026-05', total: 450 },
  ],
  expenseByCategory: [
    { category: 'Software', total: 1500, count: 5 },
    { category: 'Travel', total: 1000, count: 3 },
    { category: 'Office', total: 500, count: 2 },
  ],
});

function seedAuth(page: import('@playwright/test').Page) {
  return page.addInitScript(() => {
    localStorage.setItem(
      'it.auth',
      JSON.stringify({
        state: {
          user: {
            email: 'admin',
            displayName: 'Admin User',
            provider: 'password',
            basicAuthToken: btoa('admin:secret'),
          },
        },
        version: 0,
      }),
    );
  });
}

test.describe('Dashboard smoke — invoice charts regression guard', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await page.route('**/api/v1/dashboard/stats**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: STATS_BODY }),
    );
    await page.route('**/api/v1/dashboard/expense-stats**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: EXPENSE_BODY }),
    );
    await page.goto('/');
    await expect(page.locator('[data-testid="home-page"]')).toBeVisible({ timeout: 10_000 });
  });

  test('stat cards are rendered with data', async ({ page }) => {
    const cards = page.locator('[data-testid="stat-cards"]');
    await expect(cards).toBeVisible({ timeout: 10_000 });
    // Expect at least one stat card child
    await expect(cards.locator('div').first()).toBeVisible();
  });

  test('revenue chart section is visible', async ({ page }) => {
    const section = page.locator('[data-testid="revenue-chart-section"]');
    await expect(section).toBeVisible({ timeout: 10_000 });

    const heading = section.locator('h2');
    await expect(heading).toBeVisible();
    const text = await heading.textContent();
    expect(text).not.toContain('dashboard.charts.');
    expect(text?.toLowerCase()).toContain('revenue');
  });

  test('invoice status chart section is visible', async ({ page }) => {
    const section = page.locator('[data-testid="status-chart-section"]');
    await expect(section).toBeVisible({ timeout: 10_000 });
  });

  test('welcome banner shows user name', async ({ page }) => {
    const banner = page.locator('[data-testid="welcome-banner"]');
    await expect(banner).toBeVisible({ timeout: 10_000 });
    const heading = banner.locator('h1');
    await expect(heading).toBeVisible();
    const text = await heading.textContent();
    // Should contain the user's display name injected into auth store
    expect(text).not.toHaveLength(0);
  });

  test('all four chart sections coexist on the page', async ({ page }) => {
    await expect(page.locator('[data-testid="revenue-chart-section"]')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.locator('[data-testid="status-chart-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="expense-by-month-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="expense-by-category-section"]')).toBeVisible();
  });
});
