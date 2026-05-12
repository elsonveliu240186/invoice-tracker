/**
 * Playwright E2E spec — Register flow (FEAT-20260512-02)
 *
 * AC-6: RegisterPage validates name, email, password strength, and confirmPassword match
 *       before calling POST /api/v1/auth/register.
 * AC-6 (success): 201 → redirect to /login with "registration successful" toast.
 * AC-6 (conflict): 409 USER_EMAIL_TAKEN → error toast.
 * AC-2: Authenticated user visiting /register is bounced to /.
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

async function mockRegisterSuccess(page: import('@playwright/test').Page) {
  await page.route('**/api/v1/auth/register', (route) =>
    route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ email: 'bob@example.com', displayName: 'Bob' }),
    }),
  );
}

async function mockRegister409(page: import('@playwright/test').Page) {
  await page.route('**/api/v1/auth/register', (route) =>
    route.fulfill({
      status: 409,
      contentType: 'application/json',
      body: JSON.stringify({
        type: 'about:blank',
        title: 'Conflict',
        status: 409,
        detail: 'An account with this email already exists.',
        code: 'USER_EMAIL_TAKEN',
      }),
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

// ── Navigate to register page ─────────────────────────────────────────────────

test.describe('RegisterPage structure', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthSession(page);
    await page.goto('/register');
    await expect(page).toHaveURL(/\/register/);
  });

  test('renders display name, email, password, and confirm-password fields', async ({ page }) => {
    await expect(page.locator('#reg-name')).toBeVisible();
    await expect(page.locator('#reg-email')).toBeVisible();
    await expect(page.locator('#reg-password')).toBeVisible();
    await expect(page.locator('#reg-confirm-password')).toBeVisible();
  });

  test('has a submit button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
  });

  test('has a link back to /login', async ({ page }) => {
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
  });
});

// ── AC-6: Validation ──────────────────────────────────────────────────────────

test.describe('AC-6: client-side validation', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthSession(page);
    await page.goto('/register');
  });

  test('shows error when displayName is blank', async ({ page }) => {
    await page.locator('#reg-email').fill('bob@example.com');
    await page.locator('#reg-password').fill('Secret1!');
    await page.locator('#reg-confirm-password').fill('Secret1!');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.locator('[role="alert"]').first()).toBeVisible();
  });

  test('shows error when email is invalid', async ({ page }) => {
    await page.locator('#reg-name').fill('Bob');
    await page.locator('#reg-email').fill('not-an-email');
    await page.locator('#reg-password').fill('Secret1!');
    await page.locator('#reg-confirm-password').fill('Secret1!');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByText(/valid email/i)).toBeVisible();
  });

  test('shows error when password is too short (< 8 chars)', async ({ page }) => {
    await page.locator('#reg-name').fill('Bob');
    await page.locator('#reg-email').fill('bob@example.com');
    await page.locator('#reg-password').fill('Abc1!');
    await page.locator('#reg-confirm-password').fill('Abc1!');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByText(/at least 8 characters/i)).toBeVisible();
  });

  test('shows error when password has no digit', async ({ page }) => {
    await page.locator('#reg-name').fill('Bob');
    await page.locator('#reg-email').fill('bob@example.com');
    await page.locator('#reg-password').fill('SecretNoDig!');
    await page.locator('#reg-confirm-password').fill('SecretNoDig!');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByText(/one letter and one digit/i)).toBeVisible();
  });

  test('shows error when passwords do not match', async ({ page }) => {
    await page.locator('#reg-name').fill('Bob');
    await page.locator('#reg-email').fill('bob@example.com');
    await page.locator('#reg-password').fill('Secret1!');
    await page.locator('#reg-confirm-password').fill('Different1!');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByText(/passwords do not match/i)).toBeVisible();
  });
});

// ── AC-6: Happy path ──────────────────────────────────────────────────────────

test.describe('AC-6: register happy path', () => {
  test('valid registration → POST /api/v1/auth/register → redirect to /login with success toast', async ({
    page,
  }) => {
    await clearAuthSession(page);
    await mockRegisterSuccess(page);
    await page.goto('/register');

    await page.locator('#reg-name').fill('Bob');
    await page.locator('#reg-email').fill('bob@example.com');
    await page.locator('#reg-password').fill('Secret1!');
    await page.locator('#reg-confirm-password').fill('Secret1!');
    await page.getByRole('button', { name: /create account/i }).click();

    // Should redirect to /login
    await expect(page).toHaveURL(/\/login/);

    // Success toast about account creation
    const toast = page.locator('[data-sonner-toast]').first();
    await expect(toast).toBeVisible({ timeout: 5000 });
    await expect(toast).toContainText(/account created/i);
  });
});

// ── AC-6: 409 email taken ─────────────────────────────────────────────────────

test.describe('AC-6: register with already-taken email', () => {
  test('409 response → error toast about email taken', async ({ page }) => {
    await clearAuthSession(page);
    await mockRegister409(page);
    await page.goto('/register');

    await page.locator('#reg-name').fill('Bob');
    await page.locator('#reg-email').fill('existing@example.com');
    await page.locator('#reg-password').fill('Secret1!');
    await page.locator('#reg-confirm-password').fill('Secret1!');
    await page.getByRole('button', { name: /create account/i }).click();

    const toast = page.locator('[data-sonner-toast]').first();
    await expect(toast).toBeVisible({ timeout: 5000 });
    await expect(toast).toContainText(/already exists/i);

    // Page stays on /register
    await expect(page).toHaveURL(/\/register/);
  });
});

// ── AC-2: Authenticated user bounced off /register ────────────────────────────

test.describe('AC-2: PublicOnlyRoute bounces authenticated user off /register', () => {
  test('authenticated user visiting /register is redirected to /', async ({ page }) => {
    await seedAuthSession(page);
    await mockClientsList(page);
    await page.goto('/register');
    await expect(page).toHaveURL('/');
    await expect(page.getByTestId('home-page')).toBeVisible();
  });
});
