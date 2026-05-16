/**
 * E2E: Invoice Preview modal & Generate & Save
 * Feature: FEAT-20260514-02
 *
 * Acceptance criteria covered:
 *   AC-2  — PreviewInvoiceButton: preview modal opens, blob iframe loads, error path
 *   AC-3  — GenerateInvoiceButton: generate PDF/DOCX → success toast + badge appears
 *            Regenerate flow: download menu shows Regenerate items after artifact exists
 *
 * All backend API calls are intercepted via page.route() — no live backend needed.
 * Data-testid selectors only.
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

const INVOICE_ID = 'inv-preview-001';
const INVOICE_NUMBER = 'INV-2026-PREV-001';

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
    issueDate: '2026-05-14',
    dueDate: '2026-06-13',
    taxRate: '0.21',
    lines: [
      {
        id: 'line-001',
        description: 'Design services',
        quantity: 3,
        unitPrice: '80.00',
        lineTotal: '240.00',
      },
    ],
    subtotal: '240.00',
    total: '290.40',
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

function makeEmptyMetadata(): ArtifactsMetadata {
  return { pdf: null, docx: null };
}

function makeMetadataWithPdf(): ArtifactsMetadata {
  return {
    pdf: { format: 'PDF', generatedAt: '2026-05-14T10:00:00Z', size: 45000 },
    docx: null,
  };
}

function makeMetadataWithBoth(): ArtifactsMetadata {
  return {
    pdf: { format: 'PDF', generatedAt: '2026-05-14T10:00:00Z', size: 45000 },
    docx: { format: 'DOCX', generatedAt: '2026-05-14T10:05:00Z', size: 22000 },
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

async function stubArtifactsMetadata(page: Page, invoiceId: string, metadata: ArtifactsMetadata) {
  await page.route(`**/api/v1/invoices/${invoiceId}/generated/metadata`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(metadata),
    }),
  );
}

async function stubPreviewPdf(page: Page, invoiceId: string) {
  await page.route(`**/api/v1/invoices/${invoiceId}/preview-pdf`, (route) =>
    route.fulfill({
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Cache-Control': 'private, no-store',
      },
      body: '%PDF-1.4\n' + '0'.repeat(1200),
    }),
  );
}

async function stubGenerateArtifact(
  page: Page,
  invoiceId: string,
  format: 'PDF' | 'DOCX',
  overwrite = false,
) {
  await page.route(
    `**/api/v1/invoices/${invoiceId}/generate?format=${format}&overwrite=${String(overwrite)}`,
    (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          format,
          generatedAt: new Date().toISOString(),
          size: format === 'PDF' ? 45000 : 22000,
        }),
      }),
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('FEAT-20260514-02: Invoice Preview & Generate', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
  });

  // ─── AC-2: Preview modal ────────────────────────────────────────────────────

  test.describe('preview-modal: PreviewInvoiceButton opens blob iframe dialog', () => {
    test('preview-1: clicking Preview opens dialog with loading spinner then iframe', async ({
      page,
    }) => {
      const invoice = makeInvoice();
      await stubInvoice(page, invoice);
      await stubArtifactsMetadata(page, invoice.id, makeEmptyMetadata());
      await stubPreviewPdf(page, invoice.id);

      await page.goto(`/invoices/${invoice.id}`);
      await expect(page.getByTestId('invoice-detail-page')).toBeVisible({ timeout: 10_000 });

      const previewBtn = page.getByTestId('btn-preview-invoice');
      await expect(previewBtn).toBeVisible();
      await expect(previewBtn).not.toBeDisabled();

      await previewBtn.click();

      // Dialog opens
      await expect(page.getByTestId('preview-dialog')).toBeVisible({ timeout: 5_000 });

      // Eventually the iframe is shown (blob URL created)
      await expect(page.getByTestId('preview-iframe')).toBeVisible({ timeout: 10_000 });
    });

    test('preview-2: dialog contains open-in-new-tab link with target _blank', async ({ page }) => {
      const invoice = makeInvoice();
      await stubInvoice(page, invoice);
      await stubArtifactsMetadata(page, invoice.id, makeEmptyMetadata());
      await stubPreviewPdf(page, invoice.id);

      await page.goto(`/invoices/${invoice.id}`);
      await expect(page.getByTestId('invoice-detail-page')).toBeVisible({ timeout: 10_000 });

      await page.getByTestId('btn-preview-invoice').click();
      await expect(page.getByTestId('preview-dialog')).toBeVisible({ timeout: 5_000 });
      await expect(page.getByTestId('preview-iframe')).toBeVisible({ timeout: 10_000 });

      const openNewTabLink = page.getByTestId('link-preview-open-new-tab');
      await expect(openNewTabLink).toBeVisible();
      await expect(openNewTabLink).toHaveAttribute('target', '_blank');
      await expect(openNewTabLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    test('preview-3: dialog has download PDF and DOCX buttons', async ({ page }) => {
      const invoice = makeInvoice();
      await stubInvoice(page, invoice);
      await stubArtifactsMetadata(page, invoice.id, makeEmptyMetadata());
      await stubPreviewPdf(page, invoice.id);

      // Stub download endpoints so button clicks don't fail
      await page.route(`**/api/v1/invoices/${invoice.id}/pdf`, (route) =>
        route.fulfill({
          status: 200,
          headers: { 'Content-Type': 'application/pdf' },
          body: '%PDF-1.4\n' + '0'.repeat(1200),
        }),
      );
      await page.route(`**/api/v1/invoices/${invoice.id}/docx`, (route) =>
        route.fulfill({
          status: 200,
          headers: {
            'Content-Type':
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          },
          body: Buffer.from([0x50, 0x4b, 0x03, 0x04]),
        }),
      );

      await page.goto(`/invoices/${invoice.id}`);
      await expect(page.getByTestId('invoice-detail-page')).toBeVisible({ timeout: 10_000 });

      await page.getByTestId('btn-preview-invoice').click();
      await expect(page.getByTestId('preview-dialog')).toBeVisible({ timeout: 5_000 });
      await expect(page.getByTestId('preview-iframe')).toBeVisible({ timeout: 10_000 });

      await expect(page.getByTestId('btn-preview-download-pdf')).toBeVisible();
      await expect(page.getByTestId('btn-preview-download-docx')).toBeVisible();
    });

    test('preview-4: preview dialog closes when dialog close button is clicked', async ({
      page,
    }) => {
      const invoice = makeInvoice();
      await stubInvoice(page, invoice);
      await stubArtifactsMetadata(page, invoice.id, makeEmptyMetadata());
      await stubPreviewPdf(page, invoice.id);

      await page.goto(`/invoices/${invoice.id}`);
      await expect(page.getByTestId('invoice-detail-page')).toBeVisible({ timeout: 10_000 });

      await page.getByTestId('btn-preview-invoice').click();
      await expect(page.getByTestId('preview-dialog')).toBeVisible({ timeout: 5_000 });
      await expect(page.getByTestId('preview-iframe')).toBeVisible({ timeout: 10_000 });

      await page.getByRole('button', { name: /close/i }).click();
      await expect(page.getByTestId('preview-dialog')).not.toBeVisible({ timeout: 5_000 });
    });

    test('preview-5: preview error shows toast and closes dialog when endpoint returns 500', async ({
      page,
    }) => {
      const invoice = makeInvoice();
      await stubInvoice(page, invoice);
      await stubArtifactsMetadata(page, invoice.id, makeEmptyMetadata());

      // Return 500 for preview
      await page.route(`**/api/v1/invoices/${invoice.id}/preview-pdf`, (route) =>
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ status: 500, detail: 'Internal error' }),
        }),
      );

      await page.goto(`/invoices/${invoice.id}`);
      await expect(page.getByTestId('invoice-detail-page')).toBeVisible({ timeout: 10_000 });

      await page.getByTestId('btn-preview-invoice').click();
      await expect(page.getByTestId('preview-dialog')).toBeVisible({ timeout: 5_000 });

      // Error toast shown and dialog closes
      await expect(page.getByText(/Failed to load preview/i)).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('preview-dialog')).not.toBeVisible({ timeout: 5_000 });
    });
  });

  // ─── AC-3: Generate & Save ──────────────────────────────────────────────────

  test.describe('generate: GenerateInvoiceButton saves PDF/DOCX artifact', () => {
    test('generate-1: Generate PDF menu item shows success toast', async ({ page }) => {
      const invoice = makeInvoice();
      await stubInvoice(page, invoice);
      await stubArtifactsMetadata(page, invoice.id, makeEmptyMetadata());
      await stubGenerateArtifact(page, invoice.id, 'PDF', false);

      await page.goto(`/invoices/${invoice.id}`);
      await expect(page.getByTestId('invoice-detail-page')).toBeVisible({ timeout: 10_000 });

      // Open generate dropdown
      const generateBtn = page.getByTestId('btn-generate-menu');
      await expect(generateBtn).toBeVisible();
      await generateBtn.click();

      // Click Generate PDF
      await expect(page.getByTestId('btn-generate-pdf')).toBeVisible({ timeout: 3_000 });
      await page.getByTestId('btn-generate-pdf').click();

      // Success toast
      await expect(page.getByText(/Invoice generated and saved/i)).toBeVisible({ timeout: 10_000 });
    });

    test('generate-2: Generate DOCX menu item shows success toast', async ({ page }) => {
      const invoice = makeInvoice();
      await stubInvoice(page, invoice);
      await stubArtifactsMetadata(page, invoice.id, makeEmptyMetadata());
      await stubGenerateArtifact(page, invoice.id, 'DOCX', false);

      await page.goto(`/invoices/${invoice.id}`);
      await expect(page.getByTestId('invoice-detail-page')).toBeVisible({ timeout: 10_000 });

      await page.getByTestId('btn-generate-menu').click();

      await expect(page.getByTestId('btn-generate-docx')).toBeVisible({ timeout: 3_000 });
      await page.getByTestId('btn-generate-docx').click();

      await expect(page.getByText(/Invoice generated and saved/i)).toBeVisible({ timeout: 10_000 });
    });

    test('generate-3: generate failure shows error toast', async ({ page }) => {
      const invoice = makeInvoice();
      await stubInvoice(page, invoice);
      await stubArtifactsMetadata(page, invoice.id, makeEmptyMetadata());

      // Return 500 for generate
      await page.route(
        `**/api/v1/invoices/${invoice.id}/generate?format=PDF&overwrite=false`,
        (route) =>
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ status: 500, detail: 'Render error' }),
          }),
      );

      await page.goto(`/invoices/${invoice.id}`);
      await expect(page.getByTestId('invoice-detail-page')).toBeVisible({ timeout: 10_000 });

      await page.getByTestId('btn-generate-menu').click();
      await expect(page.getByTestId('btn-generate-pdf')).toBeVisible({ timeout: 3_000 });
      await page.getByTestId('btn-generate-pdf').click();

      await expect(page.getByText(/Failed to generate invoice/i)).toBeVisible({ timeout: 10_000 });
    });

    test('generate-4: after artifact exists, download menu shows saved PDF item and regenerate', async ({
      page,
    }) => {
      const invoice = makeInvoice();
      await stubInvoice(page, invoice);
      // Metadata returns existing PDF artifact
      await stubArtifactsMetadata(page, invoice.id, makeMetadataWithPdf());

      await page.goto(`/invoices/${invoice.id}`);
      await expect(page.getByTestId('invoice-detail-page')).toBeVisible({ timeout: 10_000 });

      // Open download menu
      await page.getByTestId('btn-download-menu').click();

      // Saved PDF item present
      await expect(page.getByTestId('btn-download-pdf')).toBeVisible({ timeout: 3_000 });
      await expect(page.getByTestId('btn-download-pdf')).toContainText(/saved PDF/i);

      // Regenerate PDF item present
      await expect(page.getByTestId('btn-regenerate-pdf')).toBeVisible();
    });

    test('generate-5: GeneratedArtifactBadge is visible when metadata has PDF artifact', async ({
      page,
    }) => {
      const invoice = makeInvoice();
      await stubInvoice(page, invoice);
      await stubArtifactsMetadata(page, invoice.id, makeMetadataWithBoth());

      await page.goto(`/invoices/${invoice.id}`);
      await expect(page.getByTestId('invoice-detail-page')).toBeVisible({ timeout: 10_000 });

      await expect(page.getByTestId('badge-generated-pdf')).toBeVisible({ timeout: 5_000 });
      await expect(page.getByTestId('badge-generated-docx')).toBeVisible();
    });
  });
});
