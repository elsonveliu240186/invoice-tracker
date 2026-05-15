/**
 * Smoke regression: adjacent flows — client list, invoice list nav, invoice detail 404
 * Feature: FEAT-20260513-03
 *
 * Verifies that the invoice-sharing changes (new routes, sidebar additions,
 * invoice detail page) did not break the previously-green adjacent flows:
 *   - Home page renders
 *   - Clients list accessible via sidebar
 *   - /invoices/:id with unknown id shows not-found empty state (no crash)
 *   - /settings/invoice-template route is reachable
 *   - Sidebar Settings section is present alongside existing nav
 *
 * No live backend required — all API calls are stubbed with page.route().
 */
import { test, expect, type Page } from '@playwright/test';

// ── Auth helper ───────────────────────────────────────────────────────────────

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

// ── API stubs ─────────────────────────────────────────────────────────────────

async function stubEmptyClientList(page: Page) {
  await page.route('**/api/v1/clients**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        content: [],
        page: 0,
        size: 20,
        totalElements: 0,
        totalPages: 1,
      }),
    }),
  );
}

async function stubInvoiceNotFound(page: Page, invoiceId: string) {
  await page.route(`**/api/v1/invoices/${invoiceId}`, (route) =>
    route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({
        type: 'about:blank',
        title: 'Not Found',
        status: 404,
        detail: 'Invoice not found',
        code: 'INVOICE_NOT_FOUND',
      }),
    }),
  );
}

async function stubDefaultTemplatePreview(page: Page) {
  await page.route('**/api/v1/settings/invoice-template/preview', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        filename: 'invoice-template.docx',
        size: 8192,
        uploadedAt: '2026-01-01T00:00:00Z',
        isDefault: true,
      }),
    }),
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Smoke regression: adjacent flows unbroken after FEAT-20260513-03', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
  });

  test('smoke-1: Home page still renders after route additions', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('home-page')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();
  });

  test('smoke-2: AppShell sidebar has Dashboard, Clients, Invoices and Settings links', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByTestId('home-page')).toBeVisible({ timeout: 10_000 });

    const nav = page.locator('nav[aria-label="Main navigation"]');
    await expect(nav).toBeVisible();

    // Existing links still present
    await expect(page.getByRole('link', { name: /dashboard/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /clients/i }).first()).toBeVisible();

    // New settings section
    await expect(page.getByTestId('nav-settings-section')).toBeVisible();
    await expect(page.getByRole('link', { name: /invoice template/i })).toBeVisible();
  });

  test('smoke-3: /clients route renders the clients page without a crash', async ({ page }) => {
    await stubEmptyClientList(page);
    await page.goto('/clients');
    await expect(page.getByTestId('clients-page')).toBeVisible({ timeout: 10_000 });
  });

  test('smoke-4: navigating to /clients via sidebar still works', async ({ page }) => {
    await stubEmptyClientList(page);
    await page.goto('/');
    await expect(page.getByTestId('home-page')).toBeVisible({ timeout: 10_000 });

    await page
      .getByRole('link', { name: /clients/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/clients/);
    await expect(page.getByTestId('clients-page')).toBeVisible({ timeout: 10_000 });
  });

  test('smoke-5: /invoices/:id with unknown id shows not-found state, not a crash', async ({
    page,
  }) => {
    await stubInvoiceNotFound(page, 'unknown-invoice-id');
    await page.goto('/invoices/unknown-invoice-id');

    await expect(page.getByTestId('invoice-detail-not-found')).toBeVisible({ timeout: 10_000 });
    // Back link is present
    await expect(page.getByTestId('link-back-to-invoices')).toBeVisible();
  });

  test('smoke-6: /settings/invoice-template renders without a crash', async ({ page }) => {
    await stubDefaultTemplatePreview(page);
    await page.goto('/settings/invoice-template');
    await expect(page.getByTestId('invoice-template-settings-page')).toBeVisible({
      timeout: 10_000,
    });
  });

  test('smoke-7: unauthenticated visit to /invoices/:id redirects to /login', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('it.auth');
    });
    await page.goto('/invoices/some-invoice-id');
    await expect(page).toHaveURL(/\/login/);
  });

  test('smoke-8: unauthenticated visit to /settings/invoice-template redirects to /login', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('it.auth');
    });
    await page.goto('/settings/invoice-template');
    await expect(page).toHaveURL(/\/login/);
  });

  test('smoke-9: ThemeToggle still works on home page after new routes added', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem('it.theme');
    });
    await page.goto('/');
    await page.waitForSelector('[data-testid="home-page"]');

    const themeBtn = page.getByRole('button', { name: /theme/i });
    await expect(themeBtn).toBeVisible();
    await themeBtn.click();
    await page.getByRole('menuitem', { name: /dark/i }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('smoke-10: invoice detail page loading state renders skeleton (no crash on slow fetch)', async ({
    page,
  }) => {
    // Route that never resolves quickly — we check the skeleton is shown
    let resolveRoute: (() => Promise<void>) | null = null;
    await page.route('**/api/v1/invoices/slow-invoice', (route) => {
      // Delay the response
      resolveRoute = () =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'slow-invoice',
            number: 'INV-SLOW',
            clientId: 'client-001',
            clientEmail: null,
            issueDate: '2026-05-13',
            dueDate: '2026-06-12',
            taxRate: '0.00',
            lines: [],
            subtotal: '0.00',
            total: '0.00',
            lastSentAt: null,
            createdAt: '2026-05-13T00:00:00Z',
            updatedAt: '2026-05-13T00:00:00Z',
          }),
        });
    });

    await page.goto('/invoices/slow-invoice');

    // Loading skeleton should appear immediately
    await expect(page.getByTestId('invoice-detail-loading')).toBeVisible({ timeout: 5_000 });

    // Resolve the route so the page can finish loading
    void resolveRoute?.();
    await expect(page.getByTestId('invoice-detail-page')).toBeVisible({ timeout: 10_000 });
  });
});
