/**
 * E2E: Send invoice email when a saved artifact exists
 * Feature: FEAT-20260514-02
 *
 * Acceptance criteria covered:
 *   AC-6  — Send button uses saved PDF when a generated artifact is present:
 *            happy path (saved artifact) → confirm → success toast → Sent on badge
 *            happy path (no saved artifact / live render) → same UX result
 *            error path (502) → error toast, no badge
 *   AC-6  — Confirm dialog subtitle "Will use saved PDF if generated…" is rendered
 *
 * All backend API calls are intercepted via page.route() — no live backend needed.
 * Data-testid selectors only. The frontend routes both paths through the same
 * POST /send-email endpoint; the saved-vs-live distinction is a backend concern.
 * These tests assert the frontend UX contract: the confirm dialog always shows the
 * subtitle hint, and the happy/error paths work regardless of artifact state.
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

// ── Invoice fixture ───────────────────────────────────────────────────────────

const INVOICE_ID = 'inv-send-saved-001';
const INVOICE_NUMBER = 'INV-2026-SAVED-001';
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
    issueDate: '2026-05-14',
    dueDate: '2026-06-13',
    taxRate: '0.21',
    lines: [
      {
        id: 'line-001',
        description: 'Development services',
        quantity: 4,
        unitPrice: '100.00',
        lineTotal: '400.00',
      },
    ],
    subtotal: '400.00',
    total: '484.00',
    lastSentAt: null,
    createdAt: '2026-05-14T08:00:00Z',
    updatedAt: '2026-05-14T08:00:00Z',
    ...overrides,
  };
}

interface ArtifactsMetadata {
  pdf: { format: string; generatedAt: string; size: number } | null;
  docx: { format: string; generatedAt: string; size: number } | null;
}

function makeMetadataWithSavedPdf(): ArtifactsMetadata {
  return {
    pdf: { format: 'PDF', generatedAt: '2026-05-14T09:00:00Z', size: 48000 },
    docx: null,
  };
}

function makeEmptyMetadata(): ArtifactsMetadata {
  return { pdf: null, docx: null };
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

async function stubArtifactsMetadata(page: Page, invoiceId: string, metadata: ArtifactsMetadata) {
  await page.route(`**/api/v1/invoices/${invoiceId}/generated/metadata`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(metadata),
    }),
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('FEAT-20260514-02 AC-6: Send email with saved artifact', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
  });

  // ─── Confirm dialog always shows subtitle ────────────────────────────────────

  test('subtitle-1: confirm dialog shows subtitle hint about saved PDF usage', async ({ page }) => {
    const invoice = makeInvoice();
    await stubInvoice(page, invoice);
    await stubArtifactsMetadata(page, invoice.id, makeMetadataWithSavedPdf());

    await page.goto(`/invoices/${invoice.id}`);
    await expect(page.getByTestId('invoice-detail-page')).toBeVisible({ timeout: 10_000 });

    await page.getByTestId('btn-send-invoice').click();
    await expect(page.getByTestId('send-confirm-dialog')).toBeVisible({ timeout: 5_000 });

    // Subtitle rendered in the dialog
    await expect(page.getByTestId('send-confirm-subtitle')).toBeVisible();
    await expect(page.getByTestId('send-confirm-subtitle')).toContainText(
      /saved PDF|renders live/i,
    );
  });

  test('subtitle-2: confirm dialog subtitle is shown even when no saved artifact exists', async ({
    page,
  }) => {
    const invoice = makeInvoice();
    await stubInvoice(page, invoice);
    await stubArtifactsMetadata(page, invoice.id, makeEmptyMetadata());

    await page.goto(`/invoices/${invoice.id}`);
    await expect(page.getByTestId('invoice-detail-page')).toBeVisible({ timeout: 10_000 });

    await page.getByTestId('btn-send-invoice').click();
    await expect(page.getByTestId('send-confirm-dialog')).toBeVisible({ timeout: 5_000 });

    await expect(page.getByTestId('send-confirm-subtitle')).toBeVisible();
  });

  // ─── Happy path: saved artifact present ─────────────────────────────────────

  test('saved-1: send succeeds when saved PDF artifact exists → success toast + Sent on badge', async ({
    page,
  }) => {
    const sentAt = '2026-05-14T11:00:00Z';
    let callCount = 0;

    await page.route(`**/api/v1/invoices/${INVOICE_ID}`, (route) => {
      callCount++;
      const data = callCount === 1 ? makeInvoice() : makeInvoice({ lastSentAt: sentAt });
      void route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(data),
      });
    });

    await stubArtifactsMetadata(page, INVOICE_ID, makeMetadataWithSavedPdf());

    await page.route(`**/api/v1/invoices/${INVOICE_ID}/send-email`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ lastSentAt: sentAt }),
      }),
    );

    await page.goto(`/invoices/${INVOICE_ID}`);
    await expect(page.getByTestId('invoice-detail-page')).toBeVisible({ timeout: 10_000 });

    // Saved PDF badge visible before send
    await expect(page.getByTestId('badge-generated-pdf')).toBeVisible({ timeout: 5_000 });

    // Send flow
    await page.getByTestId('btn-send-invoice').click();
    await expect(page.getByTestId('send-confirm-dialog')).toBeVisible({ timeout: 5_000 });
    await page.getByTestId('btn-confirm-send').click();

    // Success toast
    await expect(page.getByText(/Invoice sent successfully/i)).toBeVisible({ timeout: 10_000 });

    // Sent on badge appears
    await expect(page.getByTestId('invoice-sent-badge')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByTestId('invoice-sent-badge')).toContainText(/Sent on/i);
  });

  // ─── Happy path: no saved artifact (live render fallback) ────────────────────

  test('live-1: send succeeds when no saved artifact (live render) → success toast + Sent on badge', async ({
    page,
  }) => {
    const sentAt = '2026-05-14T11:30:00Z';
    let callCount = 0;

    await page.route(`**/api/v1/invoices/${INVOICE_ID}`, (route) => {
      callCount++;
      const data = callCount === 1 ? makeInvoice() : makeInvoice({ lastSentAt: sentAt });
      void route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(data),
      });
    });

    await stubArtifactsMetadata(page, INVOICE_ID, makeEmptyMetadata());

    await page.route(`**/api/v1/invoices/${INVOICE_ID}/send-email`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ lastSentAt: sentAt }),
      }),
    );

    await page.goto(`/invoices/${INVOICE_ID}`);
    await expect(page.getByTestId('invoice-detail-page')).toBeVisible({ timeout: 10_000 });

    // No saved PDF badge
    await expect(page.getByTestId('badge-generated-pdf')).not.toBeVisible({ timeout: 3_000 });

    await page.getByTestId('btn-send-invoice').click();
    await expect(page.getByTestId('send-confirm-dialog')).toBeVisible({ timeout: 5_000 });
    await page.getByTestId('btn-confirm-send').click();

    await expect(page.getByText(/Invoice sent successfully/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('invoice-sent-badge')).toBeVisible({ timeout: 5_000 });
  });

  // ─── Error path ──────────────────────────────────────────────────────────────

  test('error-1: 502 EMAIL_DELIVERY_FAILED shows error toast even when saved artifact present', async ({
    page,
  }) => {
    const invoice = makeInvoice();
    await stubInvoice(page, invoice);
    await stubArtifactsMetadata(page, invoice.id, makeMetadataWithSavedPdf());

    await page.route(`**/api/v1/invoices/${invoice.id}/send-email`, (route) =>
      route.fulfill({
        status: 502,
        contentType: 'application/json',
        body: JSON.stringify({
          type: 'about:blank',
          title: 'Bad Gateway',
          status: 502,
          detail: 'Email delivery failed. Please try again later.',
          code: 'EMAIL_DELIVERY_FAILED',
        }),
      }),
    );

    await page.goto(`/invoices/${invoice.id}`);
    await expect(page.getByTestId('invoice-detail-page')).toBeVisible({ timeout: 10_000 });

    await page.getByTestId('btn-send-invoice').click();
    await expect(page.getByTestId('send-confirm-dialog')).toBeVisible({ timeout: 5_000 });
    await page.getByTestId('btn-confirm-send').click();

    await expect(page.getByText(/Failed to send invoice/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('invoice-sent-badge')).not.toBeVisible({ timeout: 3_000 });
  });

  // ─── Cancel does not send ─────────────────────────────────────────────────────

  test('cancel-1: cancelling confirm dialog does not issue send-email request', async ({
    page,
  }) => {
    const invoice = makeInvoice();
    await stubInvoice(page, invoice);
    await stubArtifactsMetadata(page, invoice.id, makeMetadataWithSavedPdf());

    let sendCalled = false;
    await page.route(`**/api/v1/invoices/${invoice.id}/send-email`, (route) => {
      sendCalled = true;
      void route.fulfill({ status: 200, body: JSON.stringify({ lastSentAt: null }) });
    });

    await page.goto(`/invoices/${invoice.id}`);
    await expect(page.getByTestId('invoice-detail-page')).toBeVisible({ timeout: 10_000 });

    await page.getByTestId('btn-send-invoice').click();
    await expect(page.getByTestId('send-confirm-dialog')).toBeVisible({ timeout: 5_000 });
    await page.getByTestId('btn-confirm-cancel').click();

    await expect(page.getByTestId('send-confirm-dialog')).not.toBeVisible({ timeout: 3_000 });
    expect(sendCalled).toBe(false);
  });
});
