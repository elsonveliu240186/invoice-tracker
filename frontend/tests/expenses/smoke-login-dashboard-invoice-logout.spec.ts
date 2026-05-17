/**
 * Smoke spec — Login → Dashboard → Create Invoice → Logout (FEAT-20260516-01)
 *
 * This spec exercises the most-trafficked path through the app to ensure the
 * expense-tracking feature (AC-1 through AC-14) has not broken the core revenue
 * flow: a user can log in, see the dashboard, create an invoice, and sign out.
 *
 * All API calls are intercepted via page.route() — no live backend required.
 * data-testid selectors only; no coupling to Tailwind classes.
 */
import { test, expect, type Page } from '@playwright/test';

// ── Shared fixtures ────────────────────────────────────────────────────────────

const INVOICE_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const CLIENT_ID = 'c0ffee01-dead-beef-cafe-123456789abc';

async function stubDashboardStats(page: Page) {
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
      body: JSON.stringify({
        content: [
          {
            id: CLIENT_ID,
            name: 'Smoke Corp',
            email: 'smoke@example.com',
            phone: null,
            address: null,
            createdAt: '2026-05-01T00:00:00Z',
            updatedAt: '2026-05-01T00:00:00Z',
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

async function stubInvoices(page: Page) {
  await page.route('**/api/v1/invoices**', (route) => {
    const method = route.request().method();
    if (method === 'POST') {
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: INVOICE_ID,
          number: 'INV-SMOKE-001',
          status: 'DRAFT',
          clientId: CLIENT_ID,
          clientName: 'Smoke Corp',
          clientEmail: 'smoke@example.com',
          issueDate: '2026-05-17',
          dueDate: '2026-06-17',
          taxRate: '0.00',
          lines: [
            {
              id: 'line-001',
              description: 'Smoke test service',
              quantity: 1,
              unitPrice: '100.00',
              amount: '100.00',
            },
          ],
          subtotal: '100.00',
          taxAmount: '0.00',
          total: '100.00',
          lastSentAt: null,
          createdAt: '2026-05-17T00:00:00Z',
          updatedAt: '2026-05-17T00:00:00Z',
        }),
      });
    }
    // GET list
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        content: [],
        page: 0,
        size: 20,
        totalElements: 0,
        totalPages: 0,
      }),
    });
  });
}

async function stubExpenses(page: Page) {
  // Broad handler first; summary-specific last so it wins in LIFO matching.
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

// ── Test: login → dashboard → create invoice → logout ─────────────────────────

test.describe('Smoke: login → dashboard → create invoice → logout', () => {
  test('full smoke flow: log in, view dashboard, create invoice, sign out', async ({ page }) => {
    // ── Step 1: Set up all stubs ──────────────────────────────────────────────
    await stubDashboardStats(page);
    await stubClients(page);
    await stubInvoices(page);
    await stubExpenses(page);

    // Stub login endpoint
    await page.route('**/api/v1/auth/login', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          email: 'qa@example.com',
          displayName: 'QA User',
        }),
      }),
    );

    // ── Step 2: Navigate to login ─────────────────────────────────────────────
    await page.addInitScript(() => {
      localStorage.removeItem('it.auth');
    });
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('#login-email')).toBeVisible({ timeout: 10_000 });

    // ── Step 3: Fill and submit credentials ───────────────────────────────────
    await page.locator('#login-email').fill('qa@example.com');
    await page.locator('#login-password').fill('Secret1!');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();

    // ── Step 4: Verify dashboard loads ────────────────────────────────────────
    await expect(page).toHaveURL('/', { timeout: 10_000 });
    // The home page contains both data-testid="home-page" and a child "dashboard-page";
    // assert just the outer wrapper to avoid strict-mode ambiguity.
    await expect(page.getByTestId('home-page')).toBeVisible({ timeout: 10_000 });

    // ── Step 5: Navigate to Invoices ──────────────────────────────────────────
    await page
      .getByRole('link', { name: /invoices/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/invoices/, { timeout: 5_000 });
    await expect(page.getByTestId('invoices-list-page')).toBeVisible({ timeout: 10_000 });

    // ── Step 6: Open create invoice form ──────────────────────────────────────
    await page.getByTestId('btn-new-invoice').click();
    await expect(page.getByTestId('invoice-form-sheet')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByTestId('invoice-form')).toBeVisible({ timeout: 5_000 });

    // ── Step 7: Fill the invoice form ─────────────────────────────────────────
    // Select client — type to filter, then click the option.
    // Use force:true so Playwright fires the mousedown/click even if an
    // overlapping element could intercept, and disable any pointer-events check.
    await page.getByTestId('input-client-search').fill('Smoke');
    await expect(page.getByTestId('client-dropdown')).toBeVisible({ timeout: 5_000 });
    await page.getByTestId(`client-option-${CLIENT_ID}`).click({ force: true });
    // Verify client was selected (dropdown gone)
    await expect(page.getByTestId('client-dropdown')).not.toBeVisible({ timeout: 3_000 });

    // Set dates
    await page.getByTestId('input-issue-date').fill('2026-05-17');
    await page.getByTestId('input-due-date').fill('2026-06-17');

    // The form starts with one empty line item at index 0 — fill it directly.
    // Do NOT click btn-add-line (that would add a second, blank line).
    await expect(page.getByTestId('line-item-0')).toBeVisible({ timeout: 3_000 });
    await page.getByTestId('input-line-description-0').fill('Smoke test service');
    await page.getByTestId('input-line-quantity-0').fill('1');
    await page.getByTestId('input-line-unit-price-0').fill('100');

    // ── Step 8: Submit the invoice ────────────────────────────────────────────
    await page.getByTestId('btn-submit').click();

    // Modal should close
    await expect(page.getByTestId('invoice-form-sheet')).not.toBeVisible({ timeout: 5_000 });

    // Toast confirms creation (text is the resolved i18n value OR the key as fallback)
    const toast = page.locator('[data-sonner-toast]').first();
    await expect(toast).toBeVisible({ timeout: 5_000 });
    // Accept either the translated label or the i18n key (built-app translation timing)
    await expect(toast).toContainText(/invoice created|invoices\.toast\.created/i);

    // ── Step 9: Sign out ──────────────────────────────────────────────────────
    await page.getByTestId('user-menu-trigger').click();
    await expect(page.getByTestId('sign-out-item')).toBeVisible({ timeout: 3_000 });
    await page.getByTestId('sign-out-item').click();

    // Redirected to /login
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });

    // Sign-out toast shown
    const logoutToast = page.locator('[data-sonner-toast]').first();
    await expect(logoutToast).toBeVisible({ timeout: 5_000 });
    await expect(logoutToast).toContainText(/signed out/i);
  });
});
