/**
 * Playwright E2E spec — Dashboard page (FEAT-20260514-01)
 *
 * AC-3: Home page (/) renders welcome banner → 4 stat cards → revenue bar chart
 *       (last 6 months) + status donut chart side-by-side on lg+, stacked below.
 *
 * All API calls are intercepted via page.route() — no live backend required.
 * A live Vite dev server IS required (pnpm dev).
 *
 * NOTE: These specs are skipped because the frontend dev server was not reachable
 * at spec-authoring time. Remove test.skip() once the stack is running.
 */
import { test, expect } from '@playwright/test';

// ── Shared fixtures ───────────────────────────────────────────────────────────

/** Seed an authenticated session in localStorage before the page loads. */
function seedAuthSession(page: import('@playwright/test').Page) {
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

/** Stub the dashboard stats API. */
function stubDashboardStats(page: import('@playwright/test').Page) {
  return page.route('**/api/v1/dashboard/stats', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        totalInvoices: 12,
        draftCount: 4,
        sentCount: 5,
        paidCount: 3,
        totalRevenue: 24500,
        paidRevenue: 8200,
        pendingRevenue: 16300,
        revenueByMonth: [
          { month: '2025-12', revenue: 0 },
          { month: '2026-01', revenue: 3200 },
          { month: '2026-02', revenue: 4100 },
          { month: '2026-03', revenue: 5800 },
          { month: '2026-04', revenue: 4400 },
          { month: '2026-05', revenue: 7000 },
        ],
      }),
    }),
  );
}

/** Stub the invoices list API (used on /invoices route). */
function stubInvoicesList(page: import('@playwright/test').Page, invoices: object[] = []) {
  return page.route('**/api/v1/invoices**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        content: invoices,
        page: 0,
        size: 20,
        totalElements: invoices.length,
        totalPages: Math.max(1, Math.ceil(invoices.length / 20)),
      }),
    }),
  );
}

// ── AC-3: Dashboard load ───────────────────────────────────────────────────────

test.describe('AC-3: Dashboard page renders all required sections', () => {
  test.skip(
    true,
    'Frontend dev server not running at spec-authoring time — remove skip when stack is up',
  );

  test.beforeEach(async ({ page }) => {
    await seedAuthSession(page);
    await stubDashboardStats(page);
    await page.goto('/');
    // Wait for dashboard content to load (stat cards replace the loading skeleton)
    await page.waitForSelector('[data-testid="stat-cards"]', { timeout: 10_000 });
  });

  test('welcome banner is visible', async ({ page }) => {
    await expect(page.getByTestId('welcome-banner')).toBeVisible();
    await expect(page.getByTestId('welcome-banner')).toContainText(/welcome/i);
  });

  test('exactly 4 stat cards are visible', async ({ page }) => {
    const cards = page.getByTestId('stat-cards').locator('[data-testid="stat-card"]');
    await expect(cards).toHaveCount(4);
    for (let i = 0; i < 4; i++) {
      await expect(cards.nth(i)).toBeVisible();
    }
  });

  test('revenue chart section is visible', async ({ page }) => {
    await expect(page.getByTestId('revenue-chart-section')).toBeVisible();
  });

  test('invoice status chart section is visible', async ({ page }) => {
    await expect(page.getByTestId('status-chart-section')).toBeVisible();
  });

  test('dashboard page test-id is present', async ({ page }) => {
    await expect(page.getByTestId('dashboard-page')).toBeVisible();
  });
});

// ── Smoke: adjacent flows unaffected ──────────────────────────────────────────

test.describe('Smoke — adjacent flows after dashboard feature', () => {
  test.skip(
    true,
    'Frontend dev server not running at spec-authoring time — remove skip when stack is up',
  );

  test('authenticated user lands on dashboard at /', async ({ page }) => {
    await seedAuthSession(page);
    await stubDashboardStats(page);
    await page.goto('/');
    await expect(page.getByTestId('dashboard-page')).toBeVisible();
    await expect(page).toHaveURL('/');
  });

  test('unauthenticated user is redirected from / to /login', async ({ page }) => {
    await page.addInitScript(() => localStorage.removeItem('it.auth'));
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('sidebar navigation to /invoices works', async ({ page }) => {
    await seedAuthSession(page);
    await stubDashboardStats(page);
    await stubInvoicesList(page);
    await page.goto('/');
    await page.waitForSelector('[data-testid="dashboard-page"]');

    const invoicesLink = page.getByRole('link', { name: /invoices/i }).first();
    await invoicesLink.click();
    await expect(page).toHaveURL(/\/invoices/);
    await expect(page.getByTestId('invoices-list-page')).toBeVisible();
  });
});
