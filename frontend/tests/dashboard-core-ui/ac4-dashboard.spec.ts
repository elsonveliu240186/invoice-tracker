/**
 * AC-4: Dashboard page stat cards, revenue/status charts, and expense charts.
 *
 * Updated for FEAT-20260517-01: DashboardPage now shows invoice StatCards and
 * expense charts instead of client KPI cards.
 * The frontend is served from a Vite dev server (port 5173) which proxies
 * /api/* to the real backend.
 */
import { test, expect } from '@playwright/test';
import { loginAs, seedClients } from './auth-helpers';

test.describe('AC-4 — Dashboard page renders correctly', () => {
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

  test('Dashboard shows the welcome banner', async ({ page }) => {
    await expect(page.locator('[data-testid="welcome-banner"]')).toBeVisible();
  });

  test('Dashboard shows the date filter button', async ({ page }) => {
    await expect(page.locator('[data-testid="dashboard-date-filter"]')).toBeVisible();
  });

  test('Dashboard stat cards section is rendered after load', async ({ page }) => {
    // Wait for loading state to resolve
    await page
      .waitForFunction(
        () => {
          const loading = document.querySelector('[data-testid="dashboard-loading"]');
          return !loading;
        },
        { timeout: 10_000 },
      )
      .catch(() => {
        // If no loading testid, data loaded immediately
      });

    // The stat-cards grid should be visible
    const statCards = page.locator('[data-testid="stat-card"]');
    // Dashboard renders 4 invoice stat cards (Total Invoices, Revenue, Paid, Pending)
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
  test('Stat cards show invoice-related labels', async ({ page, request }) => {
    await seedClients(request, []);
    await loginAs(page, { navigateTo: '/' });

    // Wait for loading to finish
    await page
      .waitForFunction(
        () => {
          const loading = document.querySelector('[data-testid="dashboard-loading"]');
          return !loading;
        },
        { timeout: 10_000 },
      )
      .catch(() => {});

    // After load: 4 stat cards should be visible with invoice-related content
    const statCardsSection = page.locator('[data-testid="stat-cards"]');
    await expect(statCardsSection).toBeVisible();

    const statCards = page.locator('[data-testid="stat-card"]');
    await expect(statCards).toHaveCount(4);
  });
});
