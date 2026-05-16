/**
 * Smoke regression spec — tests the most-trafficked adjacent flows after
 * the auth feature is introduced (FEAT-20260512-02).
 *
 * Exercises:
 * - / and /clients are still reachable after login
 * - ThemeToggle, sidebar, navigation still work inside the authenticated shell
 * - The 404 fallback still renders inside AppShell when authenticated
 *
 * All API calls intercepted via page.route() — no live backend required.
 */
import { test, expect } from '@playwright/test';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function seedAuthSession(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    const session = {
      state: {
        user: {
          email: 'alice@example.com',
          displayName: 'Alice',
          provider: 'password',
          basicAuthToken: btoa('alice@example.com:Secret1!'),
        },
      },
      version: 0,
    };
    localStorage.setItem('it.auth', JSON.stringify(session));
  });
}

async function mockClientsList(page: import('@playwright/test').Page) {
  await page.route('**/api/v1/clients**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        content: [
          {
            id: 'uuid-1',
            name: 'Acme Corp',
            email: 'acme@example.com',
            phone: null,
            address: null,
            createdAt: '2026-05-12T10:00:00Z',
            updatedAt: '2026-05-12T10:00:00Z',
          },
        ],
        page: 0,
        size: 20,
        totalElements: 1,
        totalPages: 1,
      }),
    }),
  );
}

async function stubDashboardStats(page: import('@playwright/test').Page) {
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

// ── Adjacent flow regressions ─────────────────────────────────────────────────

test.describe('smoke regression — auth adjacent flows', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test.beforeEach(async ({ page }) => {
    await seedAuthSession(page);
    await mockClientsList(page);
    await stubDashboardStats(page);
  });

  test('app loads at / without console errors when authenticated', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    await page.waitForSelector('[data-testid="dashboard-page"]');

    expect(errors).toHaveLength(0);
  });

  test('AppShell TopNav and Sidebar render on home page when authenticated', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="dashboard-page"]');

    await expect(page.locator('header')).toBeVisible();
    await expect(page.getByTestId('desktop-sidebar')).toBeVisible();
    await expect(page.getByRole('button', { name: /theme/i })).toBeVisible();
  });

  test('/clients route is navigable via sidebar link when authenticated', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="dashboard-page"]');

    await page
      .getByRole('link', { name: /clients/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/clients/);
    await expect(page.getByTestId('clients-page')).toBeVisible();
  });

  test('/clients page renders with client rows when authenticated', async ({ page }) => {
    await page.goto('/clients');
    await page.waitForSelector('[data-testid="clients-page"]');

    await expect(page.getByTestId('clients-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: /clients/i })).toBeVisible();
    await expect(page.getByTestId('clients-table')).toBeVisible();
    await expect(page.getByTestId('client-row').first()).toContainText('Acme Corp');
  });

  test('ThemeToggle still works when authenticated', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem('it.theme');
    });
    await seedAuthSession(page);
    await page.goto('/');
    await page.waitForSelector('[data-testid="dashboard-page"]');

    const themeBtn = page.getByRole('button', { name: /theme/i });
    await expect(themeBtn).toBeVisible();

    await themeBtn.click();
    await page.getByRole('menuitem', { name: /dark/i }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    await themeBtn.click();
    await page.getByRole('menuitem', { name: /light/i }).click();
    const cls = await page.evaluate(() => document.documentElement.className);
    expect(cls).not.toContain('dark');
  });

  test('404 route renders not-found inside AppShell when authenticated', async ({ page }) => {
    await page.goto('/does-not-exist');

    // AppShell still present (ProtectedRoute passes, then * matches NotFound)
    await expect(page.locator('header')).toBeVisible();
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toContain('Page not found');
  });

  test('dashboard page is accessible via sidebar Dashboard link', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="dashboard-page"]');

    await page
      .getByRole('link', { name: /dashboard/i })
      .first()
      .click();
    await expect(page).toHaveURL('/');
    await expect(page.getByTestId('dashboard-page')).toBeVisible();
  });

  test('back navigation from /clients to / works when authenticated', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="dashboard-page"]');

    await page.goto('/clients');
    await page.waitForSelector('[data-testid="clients-page"]');

    await page.goBack();
    await expect(page).toHaveURL('/');
    await expect(page.getByTestId('dashboard-page')).toBeVisible();
  });
});
