/**
 * Playwright E2E spec — Forgot-password flow (FEAT-20260512-02)
 *
 * AC-7: ForgotPasswordPage validates email and on submit calls POST /api/v1/auth/forgot-password.
 *       Always shows the same generic confirmation toast — no user enumeration.
 * AC-2: Authenticated user visiting /forgot-password is bounced to /.
 *
 * API calls are intercepted via page.route() — no live backend required.
 */
import { test, expect } from '@playwright/test';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function clearAuthSession(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    localStorage.removeItem('it.auth');
  });
}

async function seedAuthSession(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    const session = {
      state: {
        user: {
          email: 'alice@example.com',
          displayName: 'Alice',
          provider: 'password',
          basicAuthToken: btoa('alice@example.com:Secret1!'),
        },
      },
      version: 0,
    };
    localStorage.setItem('it.auth', JSON.stringify(session));
  });
}

async function mockForgotPasswordSuccess(page: import('@playwright/test').Page) {
  await page.route('**/api/v1/auth/forgot-password', (route) =>
    route.fulfill({ status: 204, body: '' }),
  );
}

async function mockForgotPasswordError(page: import('@playwright/test').Page) {
  // Even when the server errors, the UI should show the same toast (anti-enumeration).
  await page.route('**/api/v1/auth/forgot-password', (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ status: 500, title: 'Internal Server Error', code: 'INTERNAL_ERROR' }),
    }),
  );
}

async function mockClientsList(page: import('@playwright/test').Page) {
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

// ── ForgotPasswordPage structure ──────────────────────────────────────────────

test.describe('ForgotPasswordPage structure', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthSession(page);
    await page.goto('/forgot-password');
    await expect(page).toHaveURL(/\/forgot-password/);
  });

  test('renders email input and submit button', async ({ page }) => {
    await expect(page.locator('#fp-email')).toBeVisible();
    await expect(page.getByRole('button', { name: /send reset link/i })).toBeVisible();
  });

  test('has link back to /login', async ({ page }) => {
    await expect(page.getByRole('link', { name: /back to sign in/i })).toBeVisible();
  });
});

// ── AC-7: Validation ──────────────────────────────────────────────────────────

test.describe('AC-7: email validation', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthSession(page);
    await page.goto('/forgot-password');
  });

  test('shows validation error when email is blank', async ({ page }) => {
    await page.getByRole('button', { name: /send reset link/i }).click();
    await expect(page.locator('[role="alert"]').first()).toBeVisible();
  });

  test('shows validation error when email format is invalid', async ({ page }) => {
    await page.locator('#fp-email').fill('not-an-email');
    await page.getByRole('button', { name: /send reset link/i }).click();
    await expect(page.getByText(/valid email/i)).toBeVisible();
  });
});

// ── AC-7: Generic toast on success ────────────────────────────────────────────

test.describe('AC-7: generic confirmation toast regardless of server response', () => {
  test('registered email → 204 → generic success toast (anti-enumeration)', async ({ page }) => {
    await clearAuthSession(page);
    await mockForgotPasswordSuccess(page);
    await page.goto('/forgot-password');

    await page.locator('#fp-email').fill('alice@example.com');
    await page.getByRole('button', { name: /send reset link/i }).click();

    const toast = page.locator('[data-sonner-toast]').first();
    await expect(toast).toBeVisible({ timeout: 5000 });
    await expect(toast).toContainText(/if that email is registered/i);
  });

  test('unknown email / server error → same generic toast (anti-enumeration)', async ({ page }) => {
    await clearAuthSession(page);
    await mockForgotPasswordError(page);
    await page.goto('/forgot-password');

    await page.locator('#fp-email').fill('unknown@example.com');
    await page.getByRole('button', { name: /send reset link/i }).click();

    const toast = page.locator('[data-sonner-toast]').first();
    await expect(toast).toBeVisible({ timeout: 5000 });
    await expect(toast).toContainText(/if that email is registered/i);
  });
});

// ── AC-2: Authenticated user bounced off /forgot-password ─────────────────────

test.describe('AC-2: PublicOnlyRoute bounces authenticated user off /forgot-password', () => {
  test('authenticated user visiting /forgot-password is redirected to /', async ({ page }) => {
    await seedAuthSession(page);
    await mockClientsList(page);
    await page.goto('/forgot-password');
    await expect(page).toHaveURL('/');
    await expect(page.getByTestId('home-page')).toBeVisible();
  });
});
