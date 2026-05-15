/**
 * Playwright E2E spec — Mark-as-Paid round-trip (FEAT-20260514-01)
 *
 * AC-2: PATCH /api/v1/invoices/{id}/mark-paid transitions any status → PAID.
 * AC-4: Invoice detail page shows StatusBadge; MarkAsPaidButton visible only
 *       when status !== 'PAID', hidden after successful PATCH.
 *
 * Also covers:
 * - Palette switch (AC per §11): clicking PaletteToggle adds/removes
 *   `.palette-teal-steel` on <html>.
 * - Dark/light theme toggle: `.dark` class toggles on <html>.
 *
 * All API calls are intercepted via page.route() — no live backend required.
 * A live Vite dev server IS required (pnpm dev).
 *
 * NOTE: These specs are skipped because the frontend dev server was not reachable
 * at spec-authoring time. Remove test.skip() once the stack is running.
 */
import { test, expect } from '@playwright/test';

// ── Shared fixtures ───────────────────────────────────────────────────────────

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

function stubDashboardStats(page: import('@playwright/test').Page) {
  return page.route('**/api/v1/dashboard/stats', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        totalInvoices: 3,
        draftCount: 1,
        sentCount: 1,
        paidCount: 1,
        totalRevenue: 5000,
        paidRevenue: 2000,
        pendingRevenue: 3000,
        revenueByMonth: [
          { month: '2025-12', revenue: 0 },
          { month: '2026-01', revenue: 1000 },
          { month: '2026-02', revenue: 1000 },
          { month: '2026-03', revenue: 1000 },
          { month: '2026-04', revenue: 1000 },
          { month: '2026-05', revenue: 1000 },
        ],
      }),
    }),
  );
}

/** A deterministic SENT invoice used as the mark-paid target. */
const SENT_INVOICE = {
  id: 'inv-sent-001',
  number: 'INV-2026-0001',
  clientId: 'client-001',
  clientEmail: 'client@example.com',
  issueDate: '2026-05-01',
  dueDate: '2026-06-01',
  taxRate: '0.00',
  lines: [
    {
      id: 'line-001',
      description: 'Consulting',
      quantity: 1,
      unitPrice: '1000.00',
      lineTotal: '1000.00',
    },
  ],
  subtotal: '1000.00',
  total: '1000.00',
  status: 'SENT',
  lastSentAt: '2026-05-10T12:00:00Z',
  createdAt: '2026-05-01T00:00:00Z',
  updatedAt: '2026-05-10T12:00:00Z',
};

/** Stub GET /api/v1/invoices to return one SENT invoice. */
function stubInvoicesListWithSent(page: import('@playwright/test').Page) {
  return page.route('**/api/v1/invoices?**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        content: [SENT_INVOICE],
        page: 0,
        size: 20,
        totalElements: 1,
        totalPages: 1,
      }),
    }),
  );
}

/** Stub GET /api/v1/invoices/:id to return the SENT invoice. */
function stubInvoiceDetail(
  page: import('@playwright/test').Page,
  invoice: typeof SENT_INVOICE = SENT_INVOICE,
) {
  return page.route(`**/api/v1/invoices/${SENT_INVOICE.id}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(invoice),
    }),
  );
}

/** Stub PATCH /api/v1/invoices/:id/mark-paid — returns invoice with status PAID. */
function stubMarkPaid(page: import('@playwright/test').Page) {
  return page.route(`**/api/v1/invoices/${SENT_INVOICE.id}/mark-paid`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...SENT_INVOICE, status: 'PAID' }),
    }),
  );
}

// ── AC-2 + AC-4: Mark-as-Paid round-trip ─────────────────────────────────────

test.describe('AC-2 + AC-4: Mark-as-Paid round-trip on invoice detail', () => {
  test.skip(
    true,
    'Frontend dev server not running at spec-authoring time — remove skip when stack is up',
  );

  test('SENT invoice shows MarkAsPaidButton; click transitions badge to PAID and hides button', async ({
    page,
  }) => {
    await seedAuthSession(page);

    // First call: detail page loads with SENT status.
    // After markPaid, the page refetches — second call returns PAID status.
    let callCount = 0;
    await page.route(`**/api/v1/invoices/${SENT_INVOICE.id}`, (route) => {
      callCount++;
      const status = callCount === 1 ? 'SENT' : 'PAID';
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...SENT_INVOICE, status }),
      });
    });
    await stubMarkPaid(page);

    await page.goto(`/invoices/${SENT_INVOICE.id}`);
    await page.waitForSelector('[data-testid="invoice-detail-page"]', { timeout: 10_000 });

    // Initial state: badge shows SENT, button is visible.
    const badge = page.getByTestId('status-badge');
    await expect(badge).toBeVisible();
    await expect(badge).toHaveAttribute('data-status', 'SENT');

    const markPaidBtn = page.getByTestId('mark-as-paid-btn');
    await expect(markPaidBtn).toBeVisible();

    // Act: click the button.
    await markPaidBtn.click();

    // Assert: badge flips to PAID.
    await expect(badge).toHaveAttribute('data-status', 'PAID', { timeout: 8_000 });

    // Assert: button disappears (returns null for PAID status).
    await expect(markPaidBtn).not.toBeVisible({ timeout: 8_000 });
  });

  test('PAID invoice does not show MarkAsPaidButton', async ({ page }) => {
    await seedAuthSession(page);
    await stubInvoiceDetail(page, { ...SENT_INVOICE, status: 'PAID' });

    await page.goto(`/invoices/${SENT_INVOICE.id}`);
    await page.waitForSelector('[data-testid="invoice-detail-page"]', { timeout: 10_000 });

    await expect(page.getByTestId('mark-as-paid-btn')).not.toBeVisible();

    const badge = page.getByTestId('status-badge');
    await expect(badge).toHaveAttribute('data-status', 'PAID');
  });

  test('invoices list page shows Status column with StatusBadge', async ({ page }) => {
    await seedAuthSession(page);
    await stubInvoicesListWithSent(page);

    await page.goto('/invoices');
    await page.waitForSelector('[data-testid="invoices-table"]', { timeout: 10_000 });

    // The table has a Status column header.
    await expect(page.getByRole('columnheader', { name: /status/i })).toBeVisible();

    // Each row has a status badge.
    const badge = page.getByTestId('invoice-row').first().getByTestId('status-badge');
    await expect(badge).toBeVisible();
  });
});

// ── Palette switch ────────────────────────────────────────────────────────────

test.describe('Palette switch — PaletteToggle adds/removes .palette-teal-steel on <html>', () => {
  test.skip(
    true,
    'Frontend dev server not running at spec-authoring time — remove skip when stack is up',
  );

  test.beforeEach(async ({ page }) => {
    await seedAuthSession(page);
    // Clear any persisted palette selection to start from navy-amber default.
    await page.addInitScript(() => {
      localStorage.removeItem('invoice-tracker-palette');
    });
    await stubDashboardStats(page);
    await page.goto('/');
    await page.waitForSelector('[data-testid="dashboard-page"]');
  });

  test('clicking PaletteToggle → Teal & Steel adds .palette-teal-steel to <html>', async ({
    page,
  }) => {
    // html should NOT have the teal class initially.
    await expect(page.locator('html')).not.toHaveClass(/palette-teal-steel/);

    // Open the palette dropdown and pick Teal & Steel.
    await page.getByRole('button', { name: /switch palette/i }).click();
    await page.getByRole('menuitem', { name: /teal.*steel/i }).click();

    await expect(page.locator('html')).toHaveClass(/palette-teal-steel/);
  });

  test('clicking PaletteToggle → Navy & Amber removes .palette-teal-steel from <html>', async ({
    page,
  }) => {
    // Start in teal-steel mode.
    await page.addInitScript(() => {
      localStorage.setItem(
        'invoice-tracker-palette',
        JSON.stringify({ state: { palette: 'teal-steel' }, version: 0 }),
      );
    });
    // Reload to pick up the persisted palette.
    await page.reload();
    await page.waitForSelector('[data-testid="dashboard-page"]');
    await expect(page.locator('html')).toHaveClass(/palette-teal-steel/);

    // Switch back.
    await page.getByRole('button', { name: /switch palette/i }).click();
    await page.getByRole('menuitem', { name: /navy.*amber/i }).click();

    await expect(page.locator('html')).not.toHaveClass(/palette-teal-steel/);
  });
});

// ── Dark / light theme toggle ─────────────────────────────────────────────────

test.describe('Dark/light theme toggle — .dark class toggles on <html>', () => {
  test.skip(
    true,
    'Frontend dev server not running at spec-authoring time — remove skip when stack is up',
  );

  test.beforeEach(async ({ page }) => {
    await seedAuthSession(page);
    await page.addInitScript(() => {
      // Force light theme as baseline.
      localStorage.setItem('it.theme', JSON.stringify({ state: { theme: 'light' }, version: 0 }));
    });
    await stubDashboardStats(page);
    await page.goto('/');
    await page.waitForSelector('[data-testid="dashboard-page"]');
  });

  test('switching to dark mode adds .dark to <html>', async ({ page }) => {
    // html should NOT have .dark in light mode.
    const htmlEl = page.locator('html');
    const initialClass = await htmlEl.getAttribute('class');
    expect(initialClass ?? '').not.toContain('dark');

    // Open theme dropdown and pick Dark.
    await page.getByRole('button', { name: /theme/i }).click();
    await page.getByRole('menuitem', { name: /dark/i }).click();

    await expect(htmlEl).toHaveClass(/dark/);
  });

  test('switching back to light mode removes .dark from <html>', async ({ page }) => {
    // Go dark first.
    await page.getByRole('button', { name: /theme/i }).click();
    await page.getByRole('menuitem', { name: /dark/i }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Switch back to light.
    await page.getByRole('button', { name: /theme/i }).click();
    await page.getByRole('menuitem', { name: /light/i }).click();

    const cls = await page.locator('html').getAttribute('class');
    expect(cls ?? '').not.toContain('dark');
  });
});
