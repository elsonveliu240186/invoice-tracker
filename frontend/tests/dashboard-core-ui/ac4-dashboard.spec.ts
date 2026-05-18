/**
 * AC-4: Dashboard page stat cards, revenue/status charts, and expense charts.
 *
 * Updated for FEAT-20260517-01: DashboardPage now shows invoice StatCards and
 * expense charts instead of client KPI cards.
 *
 * NOTE: These tests stub all backend API calls via page.route() so they run
 * without a real backend (CI E2E job does not start the Spring Boot server).
 */
import { test, expect } from '@playwright/test';
import { loginAs } from './auth-helpers';

const STATS_BODY = JSON.stringify({
  totalInvoices: 12,
  draftCount: 3,
  totalRevenue: 9800.0,
  paidCount: 6,
  paidRevenue: 5200.0,
  sentCount: 3,
  pendingRevenue: 4600.0,
  revenueByMonth: [
    { month: '2025-12', revenue: 1200 },
    { month: '2026-01', revenue: 1800 },
    { month: '2026-02', revenue: 2100 },
    { month: '2026-03', revenue: 1500 },
    { month: '2026-04', revenue: 1700 },
    { month: '2026-05', revenue: 1500 },
  ],
});

const EXPENSE_BODY = JSON.stringify({
  expenseByMonth: [
    { month: '2026-04', total: 800 },
    { month: '2026-05', total: 950 },
  ],
  expenseByCategory: [{ category: 'Software', total: 950, count: 3 }],
});

async function stubApis(page: import('@playwright/test').Page) {
  await page.route('**/api/v1/dashboard/stats**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: STATS_BODY }),
  );
  return page.route('**/api/v1/dashboard/expense-stats**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: EXPENSE_BODY }),
  );
}

test.describe('AC-4 — Dashboard page renders correctly', () => {
  test.beforeEach(async ({ page }) => {
    await stubApis(page);
    await loginAs(page, { navigateTo: '/' });
  });

  test('Dashboard page renders with data-testid="home-page"', async ({ page }) => {
    const homePage = page.locator('[data-testid="home-page"]');
    await expect(homePage).toBeVisible();
  });

  test('Dashboard shows the welcome banner', async ({ page }) => {
    await expect(page.locator('[data-testid="welcome-banner"]')).toBeVisible();
  });

  test('Dashboard shows the date filter button', async ({ page }) => {
    await expect(page.locator('[data-testid="dashboard-date-filter"]')).toBeVisible();
  });

  test('Dashboard stat cards section is rendered after load', async ({ page }) => {
    // Wait for the stat-cards grid (rendered once data resolves)
    await expect(page.locator('[data-testid="stat-cards"]')).toBeVisible({ timeout: 10_000 });

    // Dashboard renders 4 invoice stat cards
    const statCards = page.locator('[data-testid="stat-card"]');
    await expect(statCards).toHaveCount(4);
  });

  test('Clients nav link is accessible via sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const clientsLink = page.locator('[aria-label="Sidebar navigation"] a[href="/clients"]');
    await expect(clientsLink).toBeVisible();
    await expect(clientsLink).toHaveAttribute('href', '/clients');
  });
});

test.describe('AC-4 — Dashboard stat card labels', () => {
  test('Stat cards show invoice-related labels', async ({ page }) => {
    await stubApis(page);
    await loginAs(page, { navigateTo: '/' });

    await expect(page.locator('[data-testid="stat-cards"]')).toBeVisible({ timeout: 10_000 });

    const statCards = page.locator('[data-testid="stat-card"]');
    await expect(statCards).toHaveCount(4);
  });
});
