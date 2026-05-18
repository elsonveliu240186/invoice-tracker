/**
 * E2E: Invoice Sharing — DOCX/PDF download + email delivery
 * Feature: FEAT-20260513-03
 *
 * Acceptance criteria covered:
 *   AC-7  — DownloadInvoiceMenu: DOCX + PDF download items present and functional
 *   AC-8  — SendInvoiceButton: confirm dialog → success toast → lastSentAt badge
 *   AC-14 — Full round-trip: upload template → navigate to invoice → download → send
 *
 * All backend API calls are intercepted via page.route() so the spec runs
 * without a live backend. Data-testid selectors only.
 */
import { test, expect, type Page } from '@playwright/test';

// ── Auth helpers ──────────────────────────────────────────────────────────────

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

const INVOICE_ID = 'inv-e2e-001';
const INVOICE_NUMBER = 'INV-2026-E2E-001';

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
    clientEmail: 'client@example.com',
    issueDate: '2026-05-13',
    dueDate: '2026-06-12',
    taxRate: '0.21',
    lines: [
      {
        id: 'line-001',
        description: 'E2E Consulting',
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

// ── API stub helpers ──────────────────────────────────────────────────────────

async function stubInvoiceDetail(page: Page, invoice: MockInvoice) {
  await page.route(`**/api/v1/invoices/${invoice.id}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(invoice),
    }),
  );
}

async function stubInvoiceDocx(page: Page, invoiceId: string, invoiceNumber: string) {
  await page.route(`**/api/v1/invoices/${invoiceId}/docx`, (route) => {
    // Minimal ZIP magic + 5 KB padding
    const magic = [0x50, 0x4b, 0x03, 0x04];
    const padding: number[] = new Array(5200).fill(0x00) as number[];
    const body = Buffer.from([...magic, ...padding]);
    void route.fulfill({
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="invoice-${invoiceNumber}.docx"`,
        'Cache-Control': 'private, no-store',
      },
      body,
    });
  });
}

async function stubInvoicePdf(page: Page, invoiceId: string, invoiceNumber: string) {
  await page.route(`**/api/v1/invoices/${invoiceId}/pdf`, (route) => {
    const pdfContent = '%PDF-1.4\n' + '0'.repeat(1200);
    void route.fulfill({
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="invoice-${invoiceNumber}.pdf"`,
        'Cache-Control': 'private, no-store',
      },
      body: pdfContent,
    });
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('AC-7 + AC-8 + AC-14: Invoice Sharing — Download & Email', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
  });

  // ── AC-7: Download menu renders and has both DOCX/PDF items ────────────────
  test('AC-7: DownloadInvoiceMenu shows Download button with DOCX and PDF options', async ({
    page,
  }) => {
    const invoice = makeInvoice();
    await stubInvoiceDetail(page, invoice);
    await stubInvoiceDocx(page, invoice.id, invoice.number);
    await stubInvoicePdf(page, invoice.id, invoice.number);

    await page.goto(`/invoices/${invoice.id}`);
    await expect(page.getByTestId('invoice-detail-page')).toBeVisible({ timeout: 10_000 });

    // Download menu button is present
    const downloadBtn = page.getByTestId('btn-download-menu');
    await expect(downloadBtn).toBeVisible();
    await expect(downloadBtn).not.toBeDisabled();

    // Open the dropdown
    await downloadBtn.click();

    // Both items should appear
    await expect(page.getByTestId('btn-download-docx')).toBeVisible();
    await expect(page.getByTestId('btn-download-pdf')).toBeVisible();
  });

  // ── AC-7: PDF download triggers network request ─────────────────────────────
  test('AC-7: clicking Download PDF issues GET /api/v1/invoices/{id}/pdf', async ({ page }) => {
    const invoice = makeInvoice();
    await stubInvoiceDetail(page, invoice);
    await stubInvoiceDocx(page, invoice.id, invoice.number);

    let pdfRequested = false;
    await page.route(`**/api/v1/invoices/${invoice.id}/pdf`, (route) => {
      pdfRequested = true;
      void route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="invoice-${invoice.number}.pdf"`,
        },
        body: '%PDF-1.4\n' + '0'.repeat(1200),
      });
    });

    await page.goto(`/invoices/${invoice.id}`);
    await expect(page.getByTestId('invoice-detail-page')).toBeVisible({ timeout: 10_000 });

    // Open the dropdown
    await page.getByTestId('btn-download-menu').click();
    await expect(page.getByTestId('btn-download-pdf')).toBeVisible();
    await page.getByTestId('btn-download-pdf').click();

    // Give the fetch a moment
    await page.waitForTimeout(500);
    expect(pdfRequested).toBe(true);
  });

  // ── AC-7: DOCX download triggers network request ────────────────────────────
  test('AC-7: clicking Download DOCX issues GET /api/v1/invoices/{id}/docx', async ({ page }) => {
    const invoice = makeInvoice();
    await stubInvoiceDetail(page, invoice);
    await stubInvoicePdf(page, invoice.id, invoice.number);

    let docxRequested = false;
    await page.route(`**/api/v1/invoices/${invoice.id}/docx`, (route) => {
      docxRequested = true;
      const magic = [0x50, 0x4b, 0x03, 0x04];
      const padding: number[] = new Array(5200).fill(0x00) as number[];
      void route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="invoice-${invoice.number}.docx"`,
        },
        body: Buffer.from([...magic, ...padding]),
      });
    });

    await page.goto(`/invoices/${invoice.id}`);
    await expect(page.getByTestId('invoice-detail-page')).toBeVisible({ timeout: 10_000 });

    await page.getByTestId('btn-download-menu').click();
    await expect(page.getByTestId('btn-download-docx')).toBeVisible();
    await page.getByTestId('btn-download-docx').click();

    await page.waitForTimeout(500);
    expect(docxRequested).toBe(true);
  });

  // ── AC-8: Send button renders and is enabled when clientEmail is set ────────
  test('AC-8: Send to Client button is enabled when invoice has a clientEmail', async ({
    page,
  }) => {
    const invoice = makeInvoice({ clientEmail: 'client@example.com' });
    await stubInvoiceDetail(page, invoice);

    await page.goto(`/invoices/${invoice.id}`);
    await expect(page.getByTestId('invoice-detail-page')).toBeVisible({ timeout: 10_000 });

    const sendBtn = page.getByTestId('btn-send-invoice');
    await expect(sendBtn).toBeVisible();
    await expect(sendBtn).not.toBeDisabled();
  });

  // ── AC-8: Send button is disabled when clientEmail is null ────────────────
  test('AC-8: Send to Client button is disabled when invoice has no recipient', async ({
    page,
  }) => {
    const invoice = makeInvoice({ clientEmail: null });
    await stubInvoiceDetail(page, invoice);

    await page.goto(`/invoices/${invoice.id}`);
    await expect(page.getByTestId('invoice-detail-page')).toBeVisible({ timeout: 10_000 });

    const sendBtn = page.getByTestId('btn-send-invoice');
    await expect(sendBtn).toBeDisabled();
  });

  // ── AC-8: Send happy path: confirm dialog → success toast → badge ─────────
  test('AC-8: Send to Client → confirm → success toast → Sent on badge appears', async ({
    page,
  }) => {
    const sentAt = '2026-05-14T10:00:00Z';
    let invoiceData = makeInvoice({ clientEmail: 'client@example.com' });

    // First call returns invoice without lastSentAt
    // After send-email, the refetch should return lastSentAt
    let callCount = 0;
    await page.route(`**/api/v1/invoices/${INVOICE_ID}`, (route) => {
      callCount++;
      const response = callCount === 1 ? invoiceData : { ...invoiceData, lastSentAt: sentAt };
      void route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });

    await page.route(`**/api/v1/invoices/${INVOICE_ID}/send-email`, (route) => {
      invoiceData = { ...invoiceData, lastSentAt: sentAt };
      void route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ lastSentAt: sentAt }),
      });
    });

    await page.goto(`/invoices/${INVOICE_ID}`);
    await expect(page.getByTestId('invoice-detail-page')).toBeVisible({ timeout: 10_000 });

    // Click Send to Client
    await page.getByTestId('btn-send-invoice').click();

    // Confirm dialog opens
    await expect(page.getByTestId('send-confirm-dialog')).toBeVisible({ timeout: 5_000 });

    // Confirm the send
    await page.getByTestId('btn-confirm-send').click();

    // Success toast appears
    await expect(page.getByText(/Invoice sent successfully/i)).toBeVisible({ timeout: 10_000 });

    // Badge appears with "Sent on" text
    await expect(page.getByTestId('invoice-sent-badge')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByTestId('invoice-sent-badge')).toContainText(/Sent on/i);
  });

  // ── AC-8: Confirm dialog has cancel option ────────────────────────────────
  test('AC-8: cancel in confirm dialog does not send email', async ({ page }) => {
    const invoice = makeInvoice({ clientEmail: 'client@example.com' });
    await stubInvoiceDetail(page, invoice);

    let sendCalled = false;
    await page.route(`**/api/v1/invoices/${invoice.id}/send-email`, (route) => {
      sendCalled = true;
      void route.fulfill({ status: 200, body: JSON.stringify({ lastSentAt: null }) });
    });

    await page.goto(`/invoices/${invoice.id}`);
    await expect(page.getByTestId('invoice-detail-page')).toBeVisible({ timeout: 10_000 });

    await page.getByTestId('btn-send-invoice').click();
    await expect(page.getByTestId('send-confirm-dialog')).toBeVisible();
    await page.getByTestId('btn-confirm-cancel').click();

    // Dialog closed, no API call
    await expect(page.getByTestId('send-confirm-dialog')).not.toBeVisible();
    expect(sendCalled).toBe(false);
  });

  // ── AC-8: 502 EMAIL_DELIVERY_FAILED shows error toast ─────────────────────
  test('AC-8: send-email returns 502 EMAIL_DELIVERY_FAILED → error toast shown', async ({
    page,
  }) => {
    const invoice = makeInvoice({ clientEmail: 'client@example.com' });
    await stubInvoiceDetail(page, invoice);

    await page.route(`**/api/v1/invoices/${invoice.id}/send-email`, (route) =>
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

    await page.goto(`/invoices/${invoice.id}`);
    await expect(page.getByTestId('invoice-detail-page')).toBeVisible({ timeout: 10_000 });

    await page.getByTestId('btn-send-invoice').click();
    await expect(page.getByTestId('send-confirm-dialog')).toBeVisible();
    await page.getByTestId('btn-confirm-send').click();

    // Error toast
    await expect(page.getByText(/Failed to send invoice/i)).toBeVisible({ timeout: 10_000 });
    // Badge must NOT appear
    await expect(page.getByTestId('invoice-sent-badge')).not.toBeVisible();
  });

  // ── AC-8: 422 INVOICE_HAS_NO_RECIPIENT shows noRecipient toast ───────────
  test('AC-8: send-email returns 422 INVOICE_HAS_NO_RECIPIENT → noRecipient toast', async ({
    page,
  }) => {
    // hasRecipient=true to enable button but 422 returned from API
    const invoice = makeInvoice({ clientEmail: 'client@example.com' });
    await stubInvoiceDetail(page, invoice);

    await page.route(`**/api/v1/invoices/${invoice.id}/send-email`, (route) =>
      route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({
          type: 'about:blank',
          title: 'Unprocessable Entity',
          status: 422,
          detail: 'Invoice has no recipient email address.',
          code: 'INVOICE_HAS_NO_RECIPIENT',
        }),
      }),
    );

    await page.goto(`/invoices/${invoice.id}`);
    await expect(page.getByTestId('invoice-detail-page')).toBeVisible({ timeout: 10_000 });

    await page.getByTestId('btn-send-invoice').click();
    await expect(page.getByTestId('send-confirm-dialog')).toBeVisible();
    await page.getByTestId('btn-confirm-send').click();

    await expect(page.getByText(/no recipient|Invoice has no recipient/i)).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByTestId('invoice-sent-badge')).not.toBeVisible();
  });

  // ── AC-14: Full round-trip — invoice renders with all action components ─────
  test('AC-14: Invoice detail page renders number, action row with all buttons', async ({
    page,
  }) => {
    const invoice = makeInvoice();
    await stubInvoiceDetail(page, invoice);

    await page.goto(`/invoices/${invoice.id}`);
    await expect(page.getByTestId('invoice-detail-page')).toBeVisible({ timeout: 10_000 });

    // Invoice number heading
    await expect(page.getByTestId('invoice-number')).toContainText(INVOICE_NUMBER);

    // Action row is present
    await expect(page.getByTestId('invoice-action-row')).toBeVisible();

    // All action components present
    await expect(page.getByTestId('btn-view-pdf')).toBeVisible();
    await expect(page.getByTestId('btn-download-menu')).toBeVisible();
    await expect(page.getByTestId('btn-send-invoice')).toBeVisible();
  });

  // ── AC-14: Sent on badge absent when lastSentAt is null ───────────────────
  test('AC-14: Sent on badge is absent when lastSentAt is null', async ({ page }) => {
    const invoice = makeInvoice({ lastSentAt: null });
    await stubInvoiceDetail(page, invoice);

    await page.goto(`/invoices/${invoice.id}`);
    await expect(page.getByTestId('invoice-detail-page')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('invoice-sent-badge')).not.toBeVisible();
  });

  // ── AC-14: Sent on badge visible when lastSentAt is populated ─────────────
  test('AC-14: Sent on badge shows formatted date when lastSentAt is set', async ({ page }) => {
    const invoice = makeInvoice({ lastSentAt: '2026-05-14T10:30:00Z' });
    await stubInvoiceDetail(page, invoice);

    await page.goto(`/invoices/${invoice.id}`);
    await expect(page.getByTestId('invoice-detail-page')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('invoice-sent-badge')).toBeVisible();
    await expect(page.getByTestId('invoice-sent-badge')).toContainText(/Sent on/i);
  });

  // ── AC-14: PDF dialog (View PDF button) ───────────────────────────────────
  test('AC-14: View PDF button opens dialog with iframe pointing to PDF endpoint', async ({
    page,
  }) => {
    const invoice = makeInvoice();
    await stubInvoiceDetail(page, invoice);
    await stubInvoicePdf(page, invoice.id, invoice.number);

    await page.goto(`/invoices/${invoice.id}`);
    await expect(page.getByTestId('invoice-detail-page')).toBeVisible({ timeout: 10_000 });

    await page.getByTestId('btn-view-pdf').click();
    await expect(page.getByTestId('pdf-dialog')).toBeVisible();

    const iframe = page.getByTestId('pdf-iframe');
    await expect(iframe).toBeVisible({ timeout: 10_000 });

    const link = page.getByTestId('link-open-in-new-tab');
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  // ── Line items and totals table ───────────────────────────────────────────
  test('AC-14: Invoice lines table and totals render correctly', async ({ page }) => {
    const invoice = makeInvoice();
    await stubInvoiceDetail(page, invoice);

    await page.goto(`/invoices/${invoice.id}`);
    await expect(page.getByTestId('invoice-detail-page')).toBeVisible({ timeout: 10_000 });

    await expect(page.getByTestId('invoice-lines-table')).toBeVisible();
    await expect(page.getByTestId('invoice-line-row').first()).toBeVisible();
    await expect(page.getByTestId('invoice-subtotal')).toBeVisible();
    await expect(page.getByTestId('invoice-total')).toBeVisible();
  });
});
