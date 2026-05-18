/**
 * AC-9: AppShell renders nav and sidebar links; mobile drawer opens/closes.
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

// Stub dashboard APIs so DashboardPage renders without a live backend.
function stubDashboard(page: import('@playwright/test').Page) {
  const statsBody = JSON.stringify({
    totalInvoices: 0, draftCount: 0, totalRevenue: 0, paidCount: 0,
    paidRevenue: 0, sentCount: 0, pendingRevenue: 0, revenueByMonth: [],
  });
  const expenseBody = JSON.stringify({ expenseByMonth: [], expenseByCategory: [] });
  void page.route('**/api/v1/dashboard/stats**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: statsBody }),
  );
  return page.route('**/api/v1/dashboard/expense-stats**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: expenseBody }),
  );
}

test.describe('AppShell layout — desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } });
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await stubClients(page);
    await stubDashboard(page);
  });

  test('AC-9: sidebar is visible on desktop viewport', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="home-page"]');

    const sidebar = page.locator('[data-testid="desktop-sidebar"]');
    await expect(sidebar).toBeVisible();
  });

  test('AC-9: sidebar contains navigation links', async ({ page }) => {
    await stubClients(page);
    await page.goto('/');
    await page.waitForSelector('[data-testid="home-page"]');

    // Sidebar has Dashboard, Clients, Invoices, Expenses — all active NavLinks
    await expect(page.getByRole('link', { name: /dashboard/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /clients/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /invoices/i }).first()).toBeVisible();
  });

  test('AC-9: clicking Clients nav link navigates to /clients', async ({ page }) => {
    await stubClients(page);
    await page.goto('/');
    await page.waitForSelector('[data-testid="home-page"]');

    await page
      .getByRole('link', { name: /clients/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/clients/);
    await expect(page.getByTestId('clients-page')).toBeVisible();
  });

  test('AC-9: hamburger button is NOT visible on desktop', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="home-page"]');

    // The hamburger has lg:hidden class — should not be visible at 1280px
    const hamburger = page.getByTestId('hamburger');
    await expect(hamburger).not.toBeVisible();
  });
});

test.describe('AppShell layout — mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await stubClients(page);
  });

  test('AC-9: sidebar is collapsed (no desktop-sidebar) on mobile viewport', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="home-page"]');

    const desktopSidebar = page.locator('[data-testid="desktop-sidebar"]');
    await expect(desktopSidebar).not.toBeVisible();
  });

  test('AC-9: hamburger button is visible on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="home-page"]');

    const hamburger = page.getByTestId('hamburger');
    await expect(hamburger).toBeVisible();
  });

  test('AC-9: drawer opens when hamburger is clicked', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="home-page"]');

    await page.getByTestId('hamburger').click();
    await expect(page.getByTestId('drawer-overlay')).toBeVisible();
    await expect(page.getByTestId('drawer-panel')).toBeVisible();
  });

  test('AC-9: drawer closes when close button is clicked', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="home-page"]');

    await page.getByTestId('hamburger').click();
    await expect(page.getByTestId('drawer-overlay')).toBeVisible();

    await page.getByTestId('sidebar-close').click();
    await expect(page.getByTestId('drawer-overlay')).not.toBeVisible();
  });

  test('AC-9: drawer closes when backdrop is clicked', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="home-page"]');

    await page.getByTestId('hamburger').click();
    await expect(page.getByTestId('drawer-overlay')).toBeVisible();

    // The drawer panel is 240px wide; click to the right of it on the exposed backdrop.
    // Viewport is 375px wide, so click at x=320 (well past the 240px panel edge).
    await page.mouse.click(320, 400);
    await expect(page.getByTestId('drawer-overlay')).not.toBeVisible();
  });

  test('AC-9: drawer closes on Escape key', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="home-page"]');

    await page.getByTestId('hamburger').click();
    await expect(page.getByTestId('drawer-overlay')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('drawer-overlay')).not.toBeVisible();
  });
});
