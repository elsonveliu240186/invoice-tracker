/**
 * E2E spec for FEAT-20260517-01: Expense Dashboard Charts.
 *
 * Verifies that both expense chart sections render with the correct
 * data-testid attributes and translated headings.
 *
 * All backend calls are stubbed via page.route() — no live backend needed.
 */
import { test, expect } from '@playwright/test';

const STATS_BODY = JSON.stringify({
  totalInvoices: 5,
  draftCount: 1,
  totalRevenue: 3200.0,
  paidCount: 3,
  paidRevenue: 1800.0,
  sentCount: 1,
  pendingRevenue: 1400.0,
  revenueByMonth: [
    { month: '2025-12', revenue: 400 },
    { month: '2026-01', revenue: 600 },
    { month: '2026-02', revenue: 700 },
    { month: '2026-03', revenue: 500 },
    { month: '2026-04', revenue: 600 },
    { month: '2026-05', revenue: 400 },
  ],
});

const EXPENSE_BODY = JSON.stringify({
  effectiveFrom: '2025-12-01',
  effectiveTo: '2026-05-31',
  totalExpenses: 2750.0,
  expenseByMonth: [
    { month: '2025-12', total: 400 },
    { month: '2026-01', total: 500 },
    { month: '2026-02', total: 450 },
    { month: '2026-03', total: 550 },
    { month: '2026-04', total: 430 },
    { month: '2026-05', total: 420 },
  ],
  expenseByCategory: [
    { category: 'Software', total: 1200, count: 4 },
    { category: 'Travel', total: 850, count: 2 },
    { category: 'Office', total: 700, count: 3 },
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

async function stubApis(page: import('@playwright/test').Page) {
  await page.route('**/api/v1/dashboard/stats**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: STATS_BODY }),
  );
  return page.route('**/api/v1/dashboard/expense-stats**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: EXPENSE_BODY }),
  );
}

test.describe('FEAT-20260517-01: Expense Dashboard Charts', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await stubApis(page);
    await page.goto('/');
    await expect(page.locator('[data-testid="home-page"]')).toBeVisible({ timeout: 10_000 });
  });

  test('expense-by-month chart section is rendered', async ({ page }) => {
    const section = page.locator('[data-testid="expense-by-month-section"]');
    await expect(section).toBeVisible({ timeout: 10_000 });

    const chart = section.locator('[data-testid="expense-by-month-chart"]');
    await expect(chart).toBeVisible();
  });

  test('expense-by-month section shows translated heading', async ({ page }) => {
    const section = page.locator('[data-testid="expense-by-month-section"]');
    await expect(section).toBeVisible({ timeout: 10_000 });

    // Heading must be translated (not a raw i18n key)
    const heading = section.locator('h2');
    await expect(heading).toBeVisible();
    const text = await heading.textContent();
    expect(text).not.toContain('dashboard.charts.');
    expect(text?.toLowerCase()).toContain('expense');
  });

  test('expense-by-category chart section is rendered', async ({ page }) => {
    const section = page.locator('[data-testid="expense-by-category-section"]');
    await expect(section).toBeVisible({ timeout: 10_000 });

    const chart = section.locator('[data-testid="expense-by-category-chart"]');
    await expect(chart).toBeVisible();
  });

  test('expense-by-category section shows translated heading', async ({ page }) => {
    const section = page.locator('[data-testid="expense-by-category-section"]');
    await expect(section).toBeVisible({ timeout: 10_000 });

    const heading = section.locator('h2');
    await expect(heading).toBeVisible();
    const text = await heading.textContent();
    expect(text).not.toContain('dashboard.charts.');
    expect(text?.toLowerCase()).toContain('category');
  });

  test('date filter button is present and toggles the filter popover', async ({ page }) => {
    const filterBtn = page.locator('[data-testid="dashboard-date-filter"]');
    await expect(filterBtn).toBeVisible();

    await filterBtn.click();
    await expect(page.locator('[data-testid="date-filter-from"]')).toBeVisible();
    await expect(page.locator('[data-testid="date-filter-to"]')).toBeVisible();
    await expect(page.locator('[data-testid="date-filter-apply"]')).toBeVisible();
    await expect(page.locator('[data-testid="date-filter-clear"]')).toBeVisible();
  });

  test('applying a date filter re-fetches both chart datasets', async ({ page }) => {
    let statsCallCount = 0;
    let expenseCallCount = 0;

    await page.route('**/api/v1/dashboard/stats**', (route) => {
      statsCallCount++;
      return route.fulfill({ status: 200, contentType: 'application/json', body: STATS_BODY });
    });
    await page.route('**/api/v1/dashboard/expense-stats**', (route) => {
      expenseCallCount++;
      return route.fulfill({ status: 200, contentType: 'application/json', body: EXPENSE_BODY });
    });

    // Initial page load already triggered calls — reset counters after initial render
    await expect(page.locator('[data-testid="expense-by-month-section"]')).toBeVisible({
      timeout: 10_000,
    });
    statsCallCount = 0;
    expenseCallCount = 0;

    // Open filter, fill dates, apply
    await page.locator('[data-testid="dashboard-date-filter"]').click();
    await page.locator('[data-testid="date-filter-from"]').fill('2026-01-01');
    await page.locator('[data-testid="date-filter-to"]').fill('2026-03-31');
    await page.locator('[data-testid="date-filter-apply"]').click();

    // Both endpoints must be re-fetched
    await page.waitForFunction(
      () => true,
      { timeout: 3_000 },
    ).catch(() => {});

    expect(statsCallCount).toBeGreaterThanOrEqual(1);
    expect(expenseCallCount).toBeGreaterThanOrEqual(1);
  });
});
