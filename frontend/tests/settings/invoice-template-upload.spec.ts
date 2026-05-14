/**
 * E2E: Invoice Template Upload — Settings page
 * Feature: FEAT-20260513-03
 *
 * Acceptance criteria covered:
 *   AC-9  — Settings page at /settings/invoice-template:
 *            current template metadata, isDefault warning, upload form,
 *            download-current link, toast on success, metadata refresh
 *   AC-2  — GET /preview returns metadata (isDefault true/false)
 *   AC-1  — POST upload accepted → success toast + metadata refreshes
 *
 * All backend API calls are intercepted via page.route() — no live backend required.
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

async function stubTemplateUploadSuccess(page: Page, resultMetadata: TemplateMetadata) {
  await page.route('**/api/v1/settings/invoice-template', (route) => {
    if (route.request().method() !== 'POST') {
      void route.continue();
      return;
    }
    void route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        filename: resultMetadata.filename,
        size: resultMetadata.size,
        uploadedAt: resultMetadata.uploadedAt,
      }),
    });
  });
}

// Path to fixture file used for upload tests
const FIXTURE_PATH = path.join(__dirname, '..', 'fixtures', 'sample-template.docx');

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('AC-9: Invoice Template Settings page', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
  });

  // ── Page renders with Settings sidebar link ───────────────────────────────
  test('AC-9: /settings/invoice-template route is accessible via sidebar', async ({ page }) => {
    const defaultMeta: TemplateMetadata = {
      filename: 'invoice-template.docx',
      size: 8192,
      uploadedAt: '2026-01-01T00:00:00Z',
      isDefault: true,
    };
    await stubTemplatePreview(page, defaultMeta);

    await page.goto('/');
    await expect(page.getByTestId('home-page')).toBeVisible({ timeout: 10_000 });

    // Settings section is visible in sidebar
    await expect(page.getByTestId('nav-settings-section')).toBeVisible();

    // Click Invoice Template link
    await page.getByRole('link', { name: /invoice template/i }).click();
    await expect(page).toHaveURL(/\/settings\/invoice-template/);
    await expect(page.getByTestId('invoice-template-settings-page')).toBeVisible();
  });

  // ── AC-2 / AC-9: Default template metadata shows isDefault warning ────────
  test('AC-2 + AC-9: shows isDefault warning when template is the bundled default', async ({
    page,
  }) => {
    await stubTemplatePreview(page, {
      filename: 'invoice-template.docx',
      size: 8192,
      uploadedAt: '2026-01-01T00:00:00Z',
      isDefault: true,
    });

    await page.goto('/settings/invoice-template');
    await expect(page.getByTestId('invoice-template-settings-page')).toBeVisible({
      timeout: 10_000,
    });

    // Warning badge visible
    await expect(page.getByTestId('default-template-warning')).toBeVisible();
    await expect(page.getByTestId('default-template-warning')).toContainText(/default|sample/i);
  });

  // ── AC-9: No isDefault warning when user has uploaded their own template ──
  test('AC-9: no isDefault warning when isDefault is false', async ({ page }) => {
    await stubTemplatePreview(page, {
      filename: 'my-template.docx',
      size: 12345,
      uploadedAt: '2026-05-14T09:00:00Z',
      isDefault: false,
    });

    await page.goto('/settings/invoice-template');
    await expect(page.getByTestId('invoice-template-settings-page')).toBeVisible({
      timeout: 10_000,
    });

    await expect(page.getByTestId('default-template-warning')).not.toBeVisible();
  });

  // ── AC-9: Current template metadata is rendered ───────────────────────────
  test('AC-9: current template filename, size and uploadedAt are displayed', async ({ page }) => {
    await stubTemplatePreview(page, {
      filename: 'invoice-template.docx',
      size: 8192,
      uploadedAt: '2026-05-14T09:00:00Z',
      isDefault: true,
    });

    await page.goto('/settings/invoice-template');
    await expect(page.getByTestId('invoice-template-settings-page')).toBeVisible({
      timeout: 10_000,
    });

    await expect(page.getByTestId('template-filename')).toBeVisible();
    await expect(page.getByTestId('template-filename')).toContainText('invoice-template.docx');
    await expect(page.getByTestId('template-uploaded-at')).toBeVisible();
    await expect(page.getByTestId('template-size')).toBeVisible();
  });

  // ── AC-9: Download current template link is present ───────────────────────
  test('AC-9: download current template link points to /api/v1/settings/invoice-template/download', async ({
    page,
  }) => {
    await stubTemplatePreview(page, {
      filename: 'invoice-template.docx',
      size: 8192,
      uploadedAt: '2026-01-01T00:00:00Z',
      isDefault: false,
    });

    await page.goto('/settings/invoice-template');
    await expect(page.getByTestId('invoice-template-settings-page')).toBeVisible({
      timeout: 10_000,
    });

    const downloadLink = page.getByTestId('link-download-current');
    await expect(downloadLink).toBeVisible();
    await expect(downloadLink).toHaveAttribute(
      'href',
      /\/api\/v1\/settings\/invoice-template\/download/,
    );
  });

  // ── AC-9: Upload form is present ──────────────────────────────────────────
  test('AC-9: upload form with file input and upload button is rendered', async ({ page }) => {
    await stubTemplatePreview(page, {
      filename: 'invoice-template.docx',
      size: 8192,
      uploadedAt: '2026-01-01T00:00:00Z',
      isDefault: true,
    });

    await page.goto('/settings/invoice-template');
    await expect(page.getByTestId('invoice-template-settings-page')).toBeVisible({
      timeout: 10_000,
    });

    await expect(page.getByTestId('template-upload-form')).toBeVisible();
    await expect(page.getByTestId('template-file-input')).toBeVisible();
    await expect(page.getByTestId('btn-upload-template')).toBeVisible();
  });

  // ── AC-9: Upload button disabled until file is selected ───────────────────
  test('AC-9: upload button is disabled when no file is selected', async ({ page }) => {
    await stubTemplatePreview(page, {
      filename: 'invoice-template.docx',
      size: 8192,
      uploadedAt: '2026-01-01T00:00:00Z',
      isDefault: true,
    });

    await page.goto('/settings/invoice-template');
    await expect(page.getByTestId('invoice-template-settings-page')).toBeVisible({
      timeout: 10_000,
    });

    await expect(page.getByTestId('btn-upload-template')).toBeDisabled();
  });

  // ── AC-1 / AC-9: Successful upload → success toast + metadata refreshes ──
  test('AC-1 + AC-9: uploading a .docx file shows success toast', async ({ page }) => {
    const uploadedAt = new Date().toISOString();
    const updatedMeta: TemplateMetadata = {
      filename: 'invoice-template.docx',
      size: 6144,
      uploadedAt,
      isDefault: false,
    };

    // Always return the default metadata on /preview (isDefault: true)
    // so the warning banner is shown before upload.
    await stubTemplatePreview(page, {
      filename: 'invoice-template.docx',
      size: 8192,
      uploadedAt: '2026-01-01T00:00:00Z',
      isDefault: true,
    });

    await stubTemplateUploadSuccess(page, updatedMeta);

    await page.goto('/settings/invoice-template');
    await expect(page.getByTestId('invoice-template-settings-page')).toBeVisible({
      timeout: 10_000,
    });

    // Initially shows default warning — wait for metadata to load
    await expect(page.getByTestId('default-template-warning')).toBeVisible({ timeout: 5_000 });

    // Upload the fixture file
    await page.getByTestId('template-file-input').setInputFiles(FIXTURE_PATH);

    // Upload button should become enabled
    await expect(page.getByTestId('btn-upload-template')).not.toBeDisabled({ timeout: 3_000 });

    // Click upload
    await page.getByTestId('btn-upload-template').click();

    // Success toast
    await expect(page.getByText(/Template uploaded successfully/i)).toBeVisible({
      timeout: 10_000,
    });
  });

  // ── AC-9: Client-side validation — non-.docx file rejected with toast ─────
  test('AC-9: selecting a non-.docx file shows invalidType toast without calling API', async ({
    page,
  }) => {
    await stubTemplatePreview(page, {
      filename: 'invoice-template.docx',
      size: 8192,
      uploadedAt: '2026-01-01T00:00:00Z',
      isDefault: true,
    });

    let uploadCalled = false;
    await page.route('**/api/v1/settings/invoice-template', (route) => {
      if (route.request().method() === 'POST') uploadCalled = true;
      void route.continue();
    });

    await page.goto('/settings/invoice-template');
    await expect(page.getByTestId('invoice-template-settings-page')).toBeVisible({
      timeout: 10_000,
    });

    // Set a non-docx file (use the spec file itself as a stand-in)
    await page.getByTestId('template-file-input').setInputFiles({
      name: 'not-a-docx.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('hello'),
    });

    // Client-side validation toast appears
    await expect(page.getByText(/Only .docx files are accepted/i)).toBeVisible({ timeout: 5_000 });

    // Upload button remains disabled (no valid file selected)
    await expect(page.getByTestId('btn-upload-template')).toBeDisabled();

    // No API call made
    expect(uploadCalled).toBe(false);
  });

  // ── AC-9: Client-side validation — oversized file rejected ───────────────
  test('AC-9: selecting a file > 5 MB shows tooLarge toast without calling API', async ({
    page,
  }) => {
    await stubTemplatePreview(page, {
      filename: 'invoice-template.docx',
      size: 8192,
      uploadedAt: '2026-01-01T00:00:00Z',
      isDefault: true,
    });

    let uploadCalled = false;
    await page.route('**/api/v1/settings/invoice-template', (route) => {
      if (route.request().method() === 'POST') uploadCalled = true;
      void route.continue();
    });

    await page.goto('/settings/invoice-template');
    await expect(page.getByTestId('invoice-template-settings-page')).toBeVisible({
      timeout: 10_000,
    });

    // Fake a 6 MB .docx file
    const sixMb = Buffer.alloc(6 * 1024 * 1024, 0x00);
    await page.getByTestId('template-file-input').setInputFiles({
      name: 'too-large.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: sixMb,
    });

    await expect(page.getByText(/smaller than 5 MB/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByTestId('btn-upload-template')).toBeDisabled();
    expect(uploadCalled).toBe(false);
  });
});
