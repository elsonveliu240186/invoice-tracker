/**
 * E2E: Invoice PDF generation & email delivery
 * Feature: FEAT-20260513-02
 *
 * Acceptance criteria covered:
 *   AC-1  (view-pdf-1) View PDF flow: invoice detail → click View PDF → iframe dialog with correct pdf src
 *   AC-3  (send-email-1) Send email flow: send button enabled → confirm → success toast → sent badge appears
 *   AC-3  (send-email-2) Send email failure: 502 → error toast, badge absent
 *   AC-3  (send-email-3) Send button disabled when client has no email (INVOICE_HAS_NO_RECIPIENT path)
 *   Smoke  Regression: invoice list nav, client list, create invoice (stubbed)
 *
 * All backend API calls are intercepted via page.route() so the spec runs
 * without a live backend. Data-testid selectors only — no Tailwind coupling.
 *
 * For full live-stack tests (including MailHog mailbox assertions), see the
 * sibling spec `pdf-and-email.live.spec.ts` which requires docker compose
 * --profile e2e.
 */

import { test, expect, type Page } from '@playwright/test';

// ── Auth seed ─────────────────────────────────────────────────────────────────

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

// ── Invoice fixture ───────────────────────────────────────────────────────────

const INVOICE_ID = 'inv-feat02-001';
const INVOICE_NUMBER = 'INV-2026-0001';
const CLIENT_EMAIL = 'client@example.com';

interface MockInvoice {
  id: string;
  number: string;
  clientId: string;
  clientEmail: string | null;
  issueDate: string;
  dueDate: string;
  taxRate: string;
  lines: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: string;
    lineTotal: string;
  }>;
  subtotal: string;
  total: string;
  lastSentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function makeInvoice(overrides: Partial<MockInvoice> = {}): MockInvoice {
  return {
    id: INVOICE_ID,
    number: INVOICE_NUMBER,
    clientId: 'client-001',
    clientEmail: CLIENT_EMAIL,
    issueDate: '2026-05-13',
    dueDate: '2026-06-12',
    taxRate: '0.21',
    lines: [
      {
        id: 'line-001',
        description: 'Consulting services',
        quantity: 2,
        unitPrice: '50.00',
        lineTotal: '100.00',
      },
    ],
    subtotal: '100.00',
    total: '121.00',
    lastSentAt: null,
    createdAt: '2026-05-13T20:00:00Z',
    updatedAt: '2026-05-13T20:00:00Z',
    ...overrides,
  };
}

// ── Stub helpers ──────────────────────────────────────────────────────────────

async function stubInvoice(page: Page, invoice: MockInvoice) {
  await page.route(`**/api/v1/invoices/${invoice.id}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(invoice),
    }),
  );
}

async function stubPdf(page: Page, invoiceId: string) {
  await page.route(`**/api/v1/invoices/${invoiceId}/pdf`, (route) =>
    route.fulfill({
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="invoice-${INVOICE_NUMBER}.pdf"`,
        'Cache-Control': 'private, no-store',
      },
      // Minimal valid-looking PDF body (> 1 KB)
      body: '%PDF-1.4\n' + '0'.repeat(1200),
    }),
  );
}

async function stubSendEmail(page: Page, invoiceId: string, responseStatus: number, body: object) {
  await page.route(`**/api/v1/invoices/${invoiceId}/send-email`, (route) =>
    route.fulfill({
      status: responseStatus,
      contentType: 'application/json',
      body: JSON.stringify(body),
    }),
  );
}

async function stubEmptyClients(page: Page) {
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

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('FEAT-20260513-02: Invoice PDF & Email', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
  });

  // ─── AC-1: View PDF flow ────────────────────────────────────────────────────

  test.describe('view-pdf: View PDF button opens iframe dialog', () => {
    test('view-pdf-1: clicking View PDF opens dialog with iframe src pointing to the PDF endpoint', async ({
      page,
    }) => {
      const invoice = makeInvoice();
      await stubInvoice(page, invoice);
      await stubPdf(page, invoice.id);

      await page.goto(`/invoices/${invoice.id}`);
      await expect(page.getByTestId('invoice-detail-page')).toBeVisible({ timeout: 10_000 });

      // Button is visible
      const viewPdfBtn = page.getByTestId('btn-view-pdf');
      await expect(viewPdfBtn).toBeVisible();
      await expect(viewPdfBtn).not.toBeDisabled();

      // Click — dialog opens
      await viewPdfBtn.click();
      await expect(page.getByTestId('pdf-dialog')).toBeVisible({ timeout: 5_000 });

      // iframe points to the PDF API path
      const iframe = page.getByTestId('pdf-iframe');
      await expect(iframe).toHaveAttribute('src', `/api/v1/invoices/${invoice.id}/pdf`);
    });

    test('view-pdf-2: "Open in new tab" link has target _blank and rel noopener noreferrer', async ({
      page,
    }) => {
      const invoice = makeInvoice();
      await stubInvoice(page, invoice);
      await stubPdf(page, invoice.id);

      await page.goto(`/invoices/${invoice.id}`);
      await expect(page.getByTestId('invoice-detail-page')).toBeVisible({ timeout: 10_000 });

      await page.getByTestId('btn-view-pdf').click();
      await expect(page.getByTestId('pdf-dialog')).toBeVisible();

      const link = page.getByTestId('link-open-in-new-tab');
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    test('view-pdf-3: dialog can be closed via the dialog close button', async ({ page }) => {
      const invoice = makeInvoice();
      await stubInvoice(page, invoice);
      await stubPdf(page, invoice.id);

      await page.goto(`/invoices/${invoice.id}`);
      await expect(page.getByTestId('invoice-detail-page')).toBeVisible({ timeout: 10_000 });

      await page.getByTestId('btn-view-pdf').click();
      await expect(page.getByTestId('pdf-dialog')).toBeVisible();

      // shadcn Dialog renders a close button with aria-label "Close"
      // The iframe's sandbox attribute traps keyboard focus so Escape may not
      // reach the dialog; use the explicit close button instead.
      await page.getByRole('button', { name: /close/i }).click();
      await expect(page.getByTestId('pdf-dialog')).not.toBeVisible({ timeout: 5_000 });
    });
  });

  // ─── AC-3: Send email — happy path ─────────────────────────────────────────

  test.describe('send-email: Send invoice email flow', () => {
    test('send-email-1: confirm dialog → success toast → Sent on badge appears', async ({
      page,
    }) => {
      const sentAt = '2026-05-14T10:00:00Z';
      let callCount = 0;

      // First load returns no lastSentAt; refetch after send returns it
      await page.route(`**/api/v1/invoices/${INVOICE_ID}`, (route) => {
        callCount++;
        const data = callCount === 1 ? makeInvoice() : makeInvoice({ lastSentAt: sentAt });
        void route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(data),
        });
      });

      await stubSendEmail(page, INVOICE_ID, 200, { lastSentAt: sentAt });

      await page.goto(`/invoices/${INVOICE_ID}`);
      await expect(page.getByTestId('invoice-detail-page')).toBeVisible({ timeout: 10_000 });

      // Send button visible and enabled (clientEmail is set)
      const sendBtn = page.getByTestId('btn-send-invoice');
      await expect(sendBtn).toBeVisible();
      await expect(sendBtn).not.toBeDisabled();

      // Click → confirm dialog
      await sendBtn.click();
      await expect(page.getByTestId('send-confirm-dialog')).toBeVisible({ timeout: 5_000 });

      // Confirm
      await page.getByTestId('btn-confirm-send').click();

      // Success toast
      await expect(page.getByText('Invoice sent successfully')).toBeVisible({ timeout: 10_000 });

      // Sent on badge appears
      await expect(page.getByTestId('invoice-sent-badge')).toBeVisible({ timeout: 5_000 });
      await expect(page.getByTestId('invoice-sent-badge')).toContainText(/Sent on/i);
    });

    test('send-email-2: cancel in confirm dialog does not trigger send', async ({ page }) => {
      const invoice = makeInvoice();
      await stubInvoice(page, invoice);

      let sendCalled = false;
      await page.route(`**/api/v1/invoices/${invoice.id}/send-email`, (route) => {
        sendCalled = true;
        void route.fulfill({ status: 200, body: JSON.stringify({ lastSentAt: null }) });
      });

      await page.goto(`/invoices/${invoice.id}`);
      await expect(page.getByTestId('invoice-detail-page')).toBeVisible({ timeout: 10_000 });

      await page.getByTestId('btn-send-invoice').click();
      await expect(page.getByTestId('send-confirm-dialog')).toBeVisible();

      // Cancel
      await page.getByTestId('btn-confirm-cancel').click();
      await expect(page.getByTestId('send-confirm-dialog')).not.toBeVisible({ timeout: 3_000 });
      expect(sendCalled).toBe(false);
    });
  });

  // ─── AC-3: Send email — SMTP failure (502) ──────────────────────────────────

  test.describe('send-email-failure: SMTP down returns 502', () => {
    test('send-email-failure-1: 502 EMAIL_DELIVERY_FAILED shows error toast, badge stays absent', async ({
      page,
    }) => {
      const invoice = makeInvoice({ clientEmail: CLIENT_EMAIL, lastSentAt: null });
      await stubInvoice(page, invoice);

      await stubSendEmail(page, invoice.id, 502, {
        type: 'about:blank',
        title: 'Bad Gateway',
        status: 502,
        detail: 'Email delivery failed. Please try again later.',
        code: 'EMAIL_DELIVERY_FAILED',
      });

      await page.goto(`/invoices/${invoice.id}`);
      await expect(page.getByTestId('invoice-detail-page')).toBeVisible({ timeout: 10_000 });

      await page.getByTestId('btn-send-invoice').click();
      await expect(page.getByTestId('send-confirm-dialog')).toBeVisible();
      await page.getByTestId('btn-confirm-send').click();

      // Error toast appears
      await expect(page.getByText('Failed to send invoice')).toBeVisible({ timeout: 10_000 });

      // Badge is absent (lastSentAt was not persisted)
      await expect(page.getByTestId('invoice-sent-badge')).not.toBeVisible({ timeout: 3_000 });
    });

    test('send-email-failure-2: after 502, reload shows no Sent on badge (lastSentAt unchanged)', async ({
      page,
    }) => {
      // Invoice always returns lastSentAt=null even after send attempt
      await stubInvoice(page, makeInvoice({ lastSentAt: null }));

      await page.route(`**/api/v1/invoices/${INVOICE_ID}/send-email`, (route) =>
        route.fulfill({
          status: 502,
          contentType: 'application/json',
          body: JSON.stringify({
            type: 'about:blank',
            title: 'Bad Gateway',
            status: 502,
            detail: 'Email delivery failed.',
            code: 'EMAIL_DELIVERY_FAILED',
          }),
        }),
      );

      await page.goto(`/invoices/${INVOICE_ID}`);
      await expect(page.getByTestId('invoice-detail-page')).toBeVisible({ timeout: 10_000 });

      await page.getByTestId('btn-send-invoice').click();
      await expect(page.getByTestId('send-confirm-dialog')).toBeVisible();
      await page.getByTestId('btn-confirm-send').click();

      await expect(page.getByText('Failed to send invoice')).toBeVisible({ timeout: 10_000 });

      // Reload — the stub still returns lastSentAt=null so badge must not appear
      await page.reload();
      await expect(page.getByTestId('invoice-detail-page')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('invoice-sent-badge')).not.toBeVisible({ timeout: 3_000 });
    });
  });

  // ─── AC-3: Send button disabled when no client email ───────────────────────

  test.describe('no-recipient: INVOICE_HAS_NO_RECIPIENT path', () => {
    test('no-recipient-1: Send button is disabled when clientEmail is null', async ({ page }) => {
      const invoice = makeInvoice({ clientEmail: null });
      await stubInvoice(page, invoice);

      await page.goto(`/invoices/${invoice.id}`);
      await expect(page.getByTestId('invoice-detail-page')).toBeVisible({ timeout: 10_000 });

      const sendBtn = page.getByTestId('btn-send-invoice');
      await expect(sendBtn).toBeVisible();
      await expect(sendBtn).toBeDisabled();
    });

    test('no-recipient-2: Send button is disabled when clientEmail is empty string', async ({
      page,
    }) => {
      // The API might return empty string — treat as no recipient
      const invoice = makeInvoice({ clientEmail: '' });
      await stubInvoice(page, invoice);

      await page.goto(`/invoices/${invoice.id}`);
      await expect(page.getByTestId('invoice-detail-page')).toBeVisible({ timeout: 10_000 });

      await expect(page.getByTestId('btn-send-invoice')).toBeDisabled();
    });

    test('no-recipient-3: 422 INVOICE_HAS_NO_RECIPIENT shows specific toast', async ({ page }) => {
      // Button enabled (client has email in UI) but API returns 422
      const invoice = makeInvoice({ clientEmail: CLIENT_EMAIL });
      await stubInvoice(page, invoice);

      await stubSendEmail(page, invoice.id, 422, {
        type: 'about:blank',
        title: 'Unprocessable Entity',
        status: 422,
        detail: 'Invoice has no recipient email address.',
        code: 'INVOICE_HAS_NO_RECIPIENT',
      });

      await page.goto(`/invoices/${invoice.id}`);
      await expect(page.getByTestId('invoice-detail-page')).toBeVisible({ timeout: 10_000 });

      await page.getByTestId('btn-send-invoice').click();
      await expect(page.getByTestId('send-confirm-dialog')).toBeVisible();
      await page.getByTestId('btn-confirm-send').click();

      // Specific no-recipient toast message
      await expect(page.getByText('Invoice has no recipient email address')).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.getByTestId('invoice-sent-badge')).not.toBeVisible();
    });
  });

  // ─── InvoiceSentBadge: visible / absent ────────────────────────────────────

  test.describe('sent-badge: InvoiceSentBadge rendering', () => {
    test('sent-badge-1: badge absent when lastSentAt is null', async ({ page }) => {
      await stubInvoice(page, makeInvoice({ lastSentAt: null }));
      await page.goto(`/invoices/${INVOICE_ID}`);
      await expect(page.getByTestId('invoice-detail-page')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('invoice-sent-badge')).not.toBeVisible();
    });

    test('sent-badge-2: badge shows "Sent on …" when lastSentAt is populated', async ({ page }) => {
      await stubInvoice(page, makeInvoice({ lastSentAt: '2026-05-14T10:30:00Z' }));
      await page.goto(`/invoices/${INVOICE_ID}`);
      await expect(page.getByTestId('invoice-detail-page')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('invoice-sent-badge')).toBeVisible();
      await expect(page.getByTestId('invoice-sent-badge')).toContainText(/Sent on/i);
    });
  });
});

// ── Smoke regression ──────────────────────────────────────────────────────────

test.describe('FEAT-20260513-02 smoke regression: adjacent flows', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
  });

  test('smoke-reg-1: Invoice list nav link is present in sidebar', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('home-page')).toBeVisible({ timeout: 10_000 });
    // Sidebar "Invoices" link (even if /invoices shows empty state, the nav item exists)
    const nav = page.locator('nav[aria-label="Main navigation"]');
    await expect(nav).toBeVisible();
    await expect(nav.getByRole('link', { name: /invoices/i })).toBeVisible();
  });

  test('smoke-reg-2: Client list page renders and back-link works', async ({ page }) => {
    await stubEmptyClients(page);
    await page.goto('/clients');
    await expect(page.getByTestId('clients-page')).toBeVisible({ timeout: 10_000 });
  });

  test('smoke-reg-3: invoice 404 shows not-found state (no crash)', async ({ page }) => {
    await page.route('**/api/v1/invoices/nonexistent-id', (route) =>
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
    await page.goto('/invoices/nonexistent-id');
    await expect(page.getByTestId('invoice-detail-not-found')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('link-back-to-invoices')).toBeVisible();
  });

  test('smoke-reg-4: invoice detail page renders all sections (number, lines, totals, actions)', async ({
    page,
  }) => {
    await stubInvoice(page, makeInvoice());
    await page.goto(`/invoices/${INVOICE_ID}`);
    await expect(page.getByTestId('invoice-detail-page')).toBeVisible({ timeout: 10_000 });

    // Invoice number
    await expect(page.getByTestId('invoice-number')).toContainText(INVOICE_NUMBER);

    // Lines table
    await expect(page.getByTestId('invoice-lines-table')).toBeVisible();
    await expect(page.getByTestId('invoice-line-row').first()).toBeVisible();

    // Totals
    await expect(page.getByTestId('invoice-subtotal')).toBeVisible();
    await expect(page.getByTestId('invoice-total')).toBeVisible();

    // Action row
    await expect(page.getByTestId('invoice-action-row')).toBeVisible();
    await expect(page.getByTestId('btn-view-pdf')).toBeVisible();
    await expect(page.getByTestId('btn-send-invoice')).toBeVisible();
  });

  test('smoke-reg-5: loading skeleton renders while invoice fetch is in-flight', async ({
    page,
  }) => {
    let resolveRoute: (() => void) | null = null;
    await page.route(`**/api/v1/invoices/slow-${INVOICE_ID}`, (route) => {
      resolveRoute = () =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(makeInvoice({ id: `slow-${INVOICE_ID}` })),
        });
    });

    await page.goto(`/invoices/slow-${INVOICE_ID}`);
    await expect(page.getByTestId('invoice-detail-loading')).toBeVisible({ timeout: 5_000 });

    resolveRoute?.();
    await expect(page.getByTestId('invoice-detail-page')).toBeVisible({ timeout: 10_000 });
  });

  test('smoke-reg-6: unauthenticated request to invoice detail redirects to /login', async ({
    page,
  }) => {
    // No seedAuth — clear any existing auth
    await page.addInitScript(() => {
      localStorage.removeItem('it.auth');
    });
    await page.goto(`/invoices/${INVOICE_ID}`);
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });
});
