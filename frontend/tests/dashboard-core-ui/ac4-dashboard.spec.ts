/**
 * AC-4: Dashboard page KPI cards and RecentActivity stub.
 *
 * The frontend is served from a Docker nginx container (port 5173) which proxies
 * /api/* to the real backend. We seed the backend with known data so KPI counts
 * are deterministic.
 */
import { test, expect } from '@playwright/test';
import { loginAs, seedClients } from './auth-helpers';

test.describe('AC-4 — Dashboard KPI cards and RecentActivity', () => {
  test.beforeEach(async ({ page, request }) => {
    await seedClients(request, [
      { name: 'Acme Corp', email: 'acme@example.com' },
      { name: 'Globex', email: 'globex@example.com' },
    ]);
    await loginAs(page, { navigateTo: '/' });
  });

  test('Dashboard page renders with data-testid="home-page"', async ({ page }) => {
    const homePage = page.locator('[data-testid="home-page"]');
    await expect(homePage).toBeVisible();
  });

  test('Dashboard shows the Dashboard heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('Total Clients KPI card shows correct count from API', async ({ page }) => {
    // Wait for KPI cards to load (skeleton disappears)
    await page
      .waitForFunction(
        () => {
          const skeletons = document.querySelectorAll('[data-testid="kpi-skeleton"]');
          return skeletons.length === 0;
        },
        { timeout: 10_000 },
      )
      .catch(() => {
        // If no skeleton testid, just wait for numbers to appear
      });

    // The Total Clients card should show 2
    const kpiValues = page.locator('[data-testid="kpi-value"]');
    // First two KPIs = Total Clients and Active Clients (same value); third = 0 (Invoices)
    await expect(kpiValues.first()).toContainText('2');
  });

  test('Invoices KPI card shows 0 (hard-coded)', async ({ page }) => {
    await page
      .waitForFunction(
        () => {
          const skeletons = document.querySelectorAll('[data-testid="kpi-skeleton"]');
          return skeletons.length === 0;
        },
        { timeout: 10_000 },
      )
      .catch(() => {});

    // Third KPI is Invoices
    const kpiValues = page.locator('[data-testid="kpi-value"]');
    await expect(kpiValues.nth(2)).toContainText('0');
  });

  test('RecentActivity section is rendered', async ({ page }) => {
    // The RecentActivity stub should be present
    const activity = page.locator('[data-testid="recent-activity"]');
    await expect(activity).toBeVisible();
  });

  test('Link to /clients is visible on dashboard', async ({ page }) => {
    const ctaLink = page.locator('[data-testid="link-clients"]');
    await expect(ctaLink).toBeVisible();
    await expect(ctaLink).toHaveAttribute('href', '/clients');
  });
});

test.describe('AC-4 — Dashboard KPI loading skeletons', () => {
  test('KPI labels are rendered (Total clients, Active clients, Invoices)', async ({
    page,
    request,
  }) => {
    await seedClients(request, []);
    await loginAs(page, { navigateTo: '/' });

    // After load: KPI card titles should be visible (use data-testid="kpi-card" to scope away
    // from the sidebar "Invoices" nav item which also contains that text)
    const kpiCards = page.locator('[data-testid="kpi-card"]');
    await expect(kpiCards).toHaveCount(3);
    await expect(kpiCards.nth(0)).toContainText('Total clients');
    await expect(kpiCards.nth(1)).toContainText('Active clients');
    await expect(kpiCards.nth(2)).toContainText('Invoices');
  });
});
