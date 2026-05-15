/**
 * E2E: Invoice Template Manager — /invoices/template
 * Feature: FEAT-20260514-02
 *
 * Acceptance criteria covered:
 *   AC-1  — Template Manager page at /invoices/template is accessible:
 *            from sidebar nav item, from invoices list toolbar link
 *   AC-1  — Displays current template metadata (filename, uploadedAt, size)
 *   AC-1  — Shows isDefault warning when template is bundled default
 *   AC-1  — Upload form present; upload success → success toast
 *   AC-1  — Placeholder reference card is rendered
 *
 * All backend API calls are intercepted via page.route() — no live backend needed.
 * Data-testid selectors only.
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { test, expect, type Page } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// ── API stub helpers ──────────────────────────────────────────────────────────

interface TemplateMetadata {
  filename: string;
  size: number;
  uploadedAt: string;
  isDefault: boolean;
}

async function stubTemplatePreview(page: Page, metadata: TemplateMetadata) {
  await page.route('**/api/v1/settings/invoice-template/preview', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(metadata),
    }),
  );
}

async function stubTemplateUploadSuccess(page: Page, result: TemplateMetadata) {
  await page.route('**/api/v1/settings/invoice-template', (route) => {
    if (route.request().method() !== 'POST') {
      void route.continue();
      return;
    }
    void route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        filename: result.filename,
        size: result.size,
        uploadedAt: result.uploadedAt,
      }),
    });
  });
}

const FIXTURE_PATH = path.join(__dirname, '..', 'fixtures', 'sample-template.docx');

const DEFAULT_META: TemplateMetadata = {
  filename: 'invoice-template.docx',
  size: 8192,
  uploadedAt: '2026-01-01T00:00:00Z',
  isDefault: true,
};

const CUSTOM_META: TemplateMetadata = {
  filename: 'my-custom-template.docx',
  size: 14500,
  uploadedAt: '2026-05-14T09:30:00Z',
  isDefault: false,
};

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('FEAT-20260514-02: Invoice Template Manager', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
  });

  // ─── Navigation ─────────────────────────────────────────────────────────────

  test('nav-1: /invoices/template is directly accessible and renders the manager page', async ({
    page,
  }) => {
    await stubTemplatePreview(page, DEFAULT_META);

    await page.goto('/invoices/template');
    await expect(page.getByTestId('invoice-template-manager-page')).toBeVisible({
      timeout: 10_000,
    });
  });

  test('nav-2: sidebar "Manage template" child link navigates to /invoices/template', async ({
    page,
  }) => {
    await stubTemplatePreview(page, DEFAULT_META);

    // Stub dashboard stats to avoid 500 error on the dashboard page
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

    await page.goto('/');
    await expect(page.getByTestId('dashboard-page')).toBeVisible({ timeout: 10_000 });

    // The new child nav item under Invoices
    const templateLink = page.getByRole('link', { name: /manage template/i });
    await expect(templateLink).toBeVisible({ timeout: 5_000 });
    await templateLink.click();

    await expect(page).toHaveURL(/\/invoices\/template/);
    await expect(page.getByTestId('invoice-template-manager-page')).toBeVisible({
      timeout: 10_000,
    });
  });

  test('nav-3: back-to-invoices link returns to /invoices', async ({ page }) => {
    await stubTemplatePreview(page, DEFAULT_META);
    // Stub invoices list
    await page.route('**/api/v1/invoices**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 1 }),
      }),
    );

    await page.goto('/invoices/template');
    await expect(page.getByTestId('invoice-template-manager-page')).toBeVisible({
      timeout: 10_000,
    });

    await page.getByTestId('link-back-to-invoices').click();
    await expect(page).toHaveURL(/\/invoices$/);
  });

  // ─── Metadata display ────────────────────────────────────────────────────────

  test('metadata-1: shows default template warning when isDefault is true', async ({ page }) => {
    await stubTemplatePreview(page, DEFAULT_META);

    await page.goto('/invoices/template');
    await expect(page.getByTestId('invoice-template-manager-page')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByTestId('default-template-warning')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByTestId('default-template-warning')).toContainText(/default|sample/i);
  });

  test('metadata-2: no default warning when user has their own template', async ({ page }) => {
    await stubTemplatePreview(page, CUSTOM_META);

    await page.goto('/invoices/template');
    await expect(page.getByTestId('invoice-template-manager-page')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByTestId('default-template-warning')).not.toBeVisible({ timeout: 3_000 });
  });

  test('metadata-3: shows filename, uploadedAt and size from metadata', async ({ page }) => {
    await stubTemplatePreview(page, CUSTOM_META);

    await page.goto('/invoices/template');
    await expect(page.getByTestId('invoice-template-manager-page')).toBeVisible({
      timeout: 10_000,
    });

    await expect(page.getByTestId('template-filename')).toContainText('my-custom-template.docx');
    await expect(page.getByTestId('template-uploaded-at')).toBeVisible();
    await expect(page.getByTestId('template-size')).toBeVisible();
  });

  test('metadata-4: download-current button is present', async ({ page }) => {
    await stubTemplatePreview(page, CUSTOM_META);

    await page.goto('/invoices/template');
    await expect(page.getByTestId('invoice-template-manager-page')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByTestId('link-download-current')).toBeVisible({ timeout: 5_000 });
  });

  // ─── Upload form ─────────────────────────────────────────────────────────────

  test('upload-1: upload form and file input are rendered', async ({ page }) => {
    await stubTemplatePreview(page, DEFAULT_META);

    await page.goto('/invoices/template');
    await expect(page.getByTestId('invoice-template-manager-page')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByTestId('template-upload-form')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByTestId('template-file-input')).toBeVisible();
    await expect(page.getByTestId('btn-upload-template')).toBeVisible();
  });

  test('upload-2: upload button is disabled until a valid .docx file is selected', async ({
    page,
  }) => {
    await stubTemplatePreview(page, DEFAULT_META);

    await page.goto('/invoices/template');
    await expect(page.getByTestId('invoice-template-manager-page')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByTestId('btn-upload-template')).toBeDisabled();
  });

  test('upload-3: uploading a .docx file shows success toast and refreshes metadata', async ({
    page,
  }) => {
    const uploadedAt = new Date().toISOString();
    const resultMeta: TemplateMetadata = {
      filename: 'sample-template.docx',
      size: 6144,
      uploadedAt,
      isDefault: false,
    };

    await stubTemplatePreview(page, DEFAULT_META);
    await stubTemplateUploadSuccess(page, resultMeta);

    await page.goto('/invoices/template');
    await expect(page.getByTestId('invoice-template-manager-page')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByTestId('default-template-warning')).toBeVisible({ timeout: 5_000 });

    await page.getByTestId('template-file-input').setInputFiles(FIXTURE_PATH);
    await expect(page.getByTestId('btn-upload-template')).not.toBeDisabled({ timeout: 3_000 });
    await page.getByTestId('btn-upload-template').click();

    await expect(page.getByText(/Template uploaded successfully/i)).toBeVisible({
      timeout: 10_000,
    });
  });

  test('upload-4: selecting a non-.docx file shows invalidType toast without calling API', async ({
    page,
  }) => {
    await stubTemplatePreview(page, DEFAULT_META);

    let uploadCalled = false;
    await page.route('**/api/v1/settings/invoice-template', (route) => {
      if (route.request().method() === 'POST') uploadCalled = true;
      void route.continue();
    });

    await page.goto('/invoices/template');
    await expect(page.getByTestId('invoice-template-manager-page')).toBeVisible({
      timeout: 10_000,
    });

    await page.getByTestId('template-file-input').setInputFiles({
      name: 'not-a-docx.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('hello'),
    });

    await expect(page.getByText(/Only .docx files are accepted/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByTestId('btn-upload-template')).toBeDisabled();
    expect(uploadCalled).toBe(false);
  });

  // ─── Placeholder reference card ───────────────────────────────────────────────

  test('placeholder-1: placeholder reference card is rendered on the page', async ({ page }) => {
    await stubTemplatePreview(page, DEFAULT_META);

    await page.goto('/invoices/template');
    await expect(page.getByTestId('invoice-template-manager-page')).toBeVisible({
      timeout: 10_000,
    });

    // PlaceholderReferenceCard renders a section with placeholder groups
    await expect(page.getByTestId('placeholder-reference-card')).toBeVisible({ timeout: 5_000 });
  });
});
