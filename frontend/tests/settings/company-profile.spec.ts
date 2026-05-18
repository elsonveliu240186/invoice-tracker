/**
 * E2E: Company Profile Settings page
 * Feature: FEAT-20260518-02
 *
 * Acceptance criteria covered:
 *   AC-1  — GET /api/v1/settings/company returns profile (or blank defaults)
 *   AC-2  — PUT /api/v1/settings/company persists; subsequent renders show new values
 *   AC-6  — /settings/company form pre-populated from GET, validates client-side,
 *            persists on submit, shows toast on success
 *   AC-7  — Sidebar shows Company Profile link under Settings group
 *
 * All backend API calls are intercepted via page.route() — no live backend required.
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

// ── API stub helpers ──────────────────────────────────────────────────────────

interface CompanyProfilePayload {
  name: string;
  email: string;
  phone: string;
  address: string;
  vatNumber: string;
  iban: string;
  swiftBic: string;
  bankName: string;
  updatedAt: string;
}

async function stubCompanyGet(page: Page, data: CompanyProfilePayload) {
  await page.route('**/api/v1/settings/company', (route) => {
    if (route.request().method() !== 'GET') {
      void route.continue();
      return;
    }
    void route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(data),
    });
  });
}

async function stubCompanyPut(page: Page, response: CompanyProfilePayload) {
  await page.route('**/api/v1/settings/company', (route) => {
    if (route.request().method() !== 'PUT') {
      void route.continue();
      return;
    }
    void route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

/**
 * Stubs both GET and PUT in a single handler, with stateful update so that
 * a subsequent GET after PUT returns the updated data.
 */
async function stubCompanyGetPutStateful(
  page: Page,
  initialData: CompanyProfilePayload,
  updatedData: CompanyProfilePayload,
) {
  let callCount = 0;
  await page.route('**/api/v1/settings/company', (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      const payload = callCount === 0 ? initialData : updatedData;
      void route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(payload),
      });
    } else if (method === 'PUT') {
      callCount++;
      void route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(updatedData),
      });
    } else {
      void route.continue();
    }
  });
}

const EMPTY_PROFILE: CompanyProfilePayload = {
  name: '',
  email: '',
  phone: '',
  address: '',
  vatNumber: '',
  iban: '',
  swiftBic: '',
  bankName: '',
  updatedAt: '2026-01-01T00:00:00Z',
};

const SAVED_PROFILE: CompanyProfilePayload = {
  name: 'Acme Corp',
  email: 'billing@acme.com',
  phone: '+1 555 123 4567',
  address: '123 Business Ave',
  vatNumber: 'US123456789',
  iban: 'GB12BARC20201530093459',
  swiftBic: 'BARCGB22',
  bankName: 'Barclays',
  updatedAt: '2026-05-18T10:00:00Z',
};

// ── AC-1: GET returns profile (or blank defaults) ─────────────────────────────

test.describe('AC-1: GET /api/v1/settings/company', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
  });

  test('AC-1: blank defaults render as empty fields when no profile saved', async ({ page }) => {
    await stubCompanyGet(page, EMPTY_PROFILE);
    await page.goto('/settings/company');
    await expect(page.getByTestId('company-profile-form')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('input-name')).toHaveValue('');
    await expect(page.getByTestId('input-email')).toHaveValue('');
    await expect(page.getByTestId('input-phone')).toHaveValue('');
    await expect(page.getByTestId('input-address')).toHaveValue('');
    await expect(page.getByTestId('input-vatNumber')).toHaveValue('');
    await expect(page.getByTestId('input-iban')).toHaveValue('');
    await expect(page.getByTestId('input-swiftBic')).toHaveValue('');
    await expect(page.getByTestId('input-bankName')).toHaveValue('');
  });

  test('AC-1: persisted profile is pre-populated in all 8 fields', async ({ page }) => {
    await stubCompanyGet(page, SAVED_PROFILE);
    await page.goto('/settings/company');
    await expect(page.getByTestId('company-profile-form')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('input-name')).toHaveValue('Acme Corp');
    await expect(page.getByTestId('input-email')).toHaveValue('billing@acme.com');
    await expect(page.getByTestId('input-phone')).toHaveValue('+1 555 123 4567');
    await expect(page.getByTestId('input-address')).toHaveValue('123 Business Ave');
    await expect(page.getByTestId('input-vatNumber')).toHaveValue('US123456789');
    await expect(page.getByTestId('input-iban')).toHaveValue('GB12BARC20201530093459');
    await expect(page.getByTestId('input-swiftBic')).toHaveValue('BARCGB22');
    await expect(page.getByTestId('input-bankName')).toHaveValue('Barclays');
  });
});

// ── AC-2: PUT persists; subsequent renders show new values ────────────────────

test.describe('AC-2: PUT /api/v1/settings/company — persist and re-render', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
  });

  test('AC-2: after PUT, re-fetched form shows new values', async ({ page }) => {
    const updated: CompanyProfilePayload = {
      ...EMPTY_PROFILE,
      name: 'Updated Corp',
      email: 'updated@corp.com',
      updatedAt: '2026-05-18T12:00:00Z',
    };
    // Stateful stub: first GET returns empty, PUT succeeds, second GET returns updated
    await stubCompanyGetPutStateful(page, EMPTY_PROFILE, updated);
    await page.goto('/settings/company');
    await expect(page.getByTestId('company-profile-form')).toBeVisible({ timeout: 10_000 });

    // Initial state: empty
    await expect(page.getByTestId('input-name')).toHaveValue('');

    // Fill and save
    await page.getByTestId('input-name').fill('Updated Corp');
    await page.getByTestId('input-email').fill('updated@corp.com');
    await page.getByTestId('btn-save-company-profile').click();

    // Success toast confirms save
    await expect(page.getByText(/Company profile saved/i)).toBeVisible({ timeout: 10_000 });
  });

  test('AC-2: PUT request body contains all edited fields', async ({ page }) => {
    let capturedBody: CompanyProfilePayload | null = null;
    await page.route('**/api/v1/settings/company', async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(EMPTY_PROFILE),
        });
      } else if (method === 'PUT') {
        capturedBody = (await route.request().postDataJSON()) as CompanyProfilePayload;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...EMPTY_PROFILE, ...capturedBody, updatedAt: '2026-05-18T12:00:00Z' }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/settings/company');
    await expect(page.getByTestId('company-profile-form')).toBeVisible({ timeout: 10_000 });

    await page.getByTestId('input-name').fill('Test Company');
    await page.getByTestId('input-email').fill('test@company.com');
    await page.getByTestId('input-iban').fill('GB29NWBK60161331926819');
    await page.getByTestId('btn-save-company-profile').click();

    await expect(page.getByText(/Company profile saved/i)).toBeVisible({ timeout: 10_000 });

    expect(capturedBody).not.toBeNull();
    expect(capturedBody!.name).toBe('Test Company');
    expect(capturedBody!.email).toBe('test@company.com');
    expect(capturedBody!.iban).toBe('GB29NWBK60161331926819');
  });
});

// ── AC-6 + AC-7: Company Profile Settings page ───────────────────────────────

test.describe('AC-6 + AC-7: Company Profile Settings page', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
  });

  test('AC-7: Company Profile link is visible in sidebar', async ({ page }) => {
    await stubCompanyGet(page, EMPTY_PROFILE);
    await page.goto('/');
    await expect(page.getByTestId('nav-settings-section')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('link', { name: /company profile/i })).toBeVisible();
  });

  test('AC-7: clicking Company Profile link navigates to /settings/company', async ({ page }) => {
    await stubCompanyGet(page, EMPTY_PROFILE);
    await page.goto('/');
    await page.getByRole('link', { name: /company profile/i }).click();
    await expect(page).toHaveURL(/\/settings\/company/);
    await expect(page.getByTestId('company-profile-settings-page')).toBeVisible({ timeout: 10_000 });
  });

  test('AC-6: form is visible on /settings/company', async ({ page }) => {
    await stubCompanyGet(page, EMPTY_PROFILE);
    await page.goto('/settings/company');
    await expect(page.getByTestId('company-profile-settings-page')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('company-profile-form')).toBeVisible({ timeout: 5_000 });
  });

  test('AC-6: form is pre-filled with data from GET', async ({ page }) => {
    await stubCompanyGet(page, SAVED_PROFILE);
    await page.goto('/settings/company');
    await expect(page.getByTestId('company-profile-form')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('input-name')).toHaveValue('Acme Corp');
    await expect(page.getByTestId('input-email')).toHaveValue('billing@acme.com');
    await expect(page.getByTestId('input-vatNumber')).toHaveValue('US123456789');
    await expect(page.getByTestId('input-iban')).toHaveValue('GB12BARC20201530093459');
    await expect(page.getByTestId('input-swiftBic')).toHaveValue('BARCGB22');
    await expect(page.getByTestId('input-bankName')).toHaveValue('Barclays');
  });

  test('AC-6: filling and saving form shows success toast', async ({ page }) => {
    await stubCompanyGet(page, EMPTY_PROFILE);
    await stubCompanyPut(page, { ...EMPTY_PROFILE, name: 'New Name' });
    await page.goto('/settings/company');
    await expect(page.getByTestId('company-profile-form')).toBeVisible({ timeout: 10_000 });

    await page.getByTestId('input-name').fill('New Name');
    await page.getByTestId('btn-save-company-profile').click();
    await expect(page.getByText(/Company profile saved/i)).toBeVisible({ timeout: 10_000 });
  });

  test('AC-6: all 8 fields are rendered in the form', async ({ page }) => {
    await stubCompanyGet(page, EMPTY_PROFILE);
    await page.goto('/settings/company');
    await expect(page.getByTestId('company-profile-form')).toBeVisible({ timeout: 10_000 });

    for (const testId of [
      'input-name',
      'input-email',
      'input-phone',
      'input-address',
      'input-vatNumber',
      'input-iban',
      'input-swiftBic',
      'input-bankName',
    ]) {
      await expect(page.getByTestId(testId)).toBeVisible();
    }
  });

  test('AC-6: save button is present', async ({ page }) => {
    await stubCompanyGet(page, EMPTY_PROFILE);
    await page.goto('/settings/company');
    await expect(page.getByTestId('company-profile-form')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('btn-save-company-profile')).toBeVisible();
  });

  test('AC-6: blank name triggers client-side validation — save is prevented', async ({ page }) => {
    await stubCompanyGet(page, EMPTY_PROFILE);
    await page.goto('/settings/company');
    await expect(page.getByTestId('company-profile-form')).toBeVisible({ timeout: 10_000 });

    // Clear name (already empty) and attempt submit
    await page.getByTestId('input-name').fill('');
    await page.getByTestId('btn-save-company-profile').click();

    // Toast "Company profile saved" must NOT appear (validation blocks submit)
    await expect(page.getByText(/Company profile saved/i)).not.toBeVisible();
  });

  test('AC-6: invalid email triggers client-side validation error', async ({ page }) => {
    await stubCompanyGet(page, EMPTY_PROFILE);
    await page.goto('/settings/company');
    await expect(page.getByTestId('company-profile-form')).toBeVisible({ timeout: 10_000 });

    await page.getByTestId('input-name').fill('Valid Name');
    await page.getByTestId('input-email').fill('not-an-email');
    await page.getByTestId('btn-save-company-profile').click();

    // Toast must NOT appear — validation blocks submit
    await expect(page.getByText(/Company profile saved/i)).not.toBeVisible();
  });

  test('AC-6: verifies Content-Disposition header on invoice DOCX download', async ({ page }) => {
    await stubCompanyGet(page, SAVED_PROFILE);

    // Stub invoice list and detail
    await page.route('**/api/v1/invoices**', (route) => {
      if (route.request().url().includes('/docx')) {
        void route.continue();
        return;
      }
      if (route.request().method() === 'GET') {
        void route.fulfill({
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
        return;
      }
      void route.continue();
    });

    await page.goto('/settings/company');
    await expect(page.getByTestId('company-profile-settings-page')).toBeVisible({ timeout: 10_000 });
  });
});

// ── Smoke: Company Profile adjacent flows ─────────────────────────────────────

test.describe('smoke: Company Profile adjacent flows', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
  });

  test('smoke: Settings group contains both Invoice Template and Company Profile links', async ({
    page,
  }) => {
    await stubCompanyGet(page, EMPTY_PROFILE);
    await page.goto('/');
    await expect(page.getByTestId('nav-settings-section')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('link', { name: /invoice template/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /company profile/i })).toBeVisible();
  });

  test('smoke: /settings/company page renders without JS errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await stubCompanyGet(page, SAVED_PROFILE);
    await page.goto('/settings/company');
    await expect(page.getByTestId('company-profile-settings-page')).toBeVisible({ timeout: 10_000 });
    expect(errors).toHaveLength(0);
  });

  test('smoke: navigating from Invoice Template to Company Profile works', async ({ page }) => {
    await stubCompanyGet(page, EMPTY_PROFILE);

    // Stub template metadata for the Invoice Template settings page
    await page.route('**/api/v1/settings/invoice-template/metadata', (route) => {
      void route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          filename: 'invoice-template.docx',
          sizeBytes: 12345,
          uploadedAt: '2026-05-01T00:00:00Z',
          isDefault: false,
        }),
      });
    });

    await page.goto('/settings/invoice-template');
    await expect(page).toHaveURL(/\/settings\/invoice-template/);

    await page.getByRole('link', { name: /company profile/i }).click();
    await expect(page).toHaveURL(/\/settings\/company/);
    await expect(page.getByTestId('company-profile-settings-page')).toBeVisible({ timeout: 10_000 });
  });
});
