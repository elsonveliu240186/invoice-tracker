/**
 * Playwright E2E spec — Login flow (FEAT-20260512-02)
 *
 * AC-1: Unauthenticated visit to /clients redirects to /login, preserving `state.from`.
 * AC-3: LoginPage renders email + password fields, Google button, links to /register and /forgot-password.
 * AC-4: Successful form submit calls POST /api/v1/auth/login → auth store set → navigate to / (or state.from).
 * AC-4 (error): 401 response shows Sonner error toast with invalidCredentials text.
 *
 * API calls are intercepted via page.route() — no live backend required.
 * data-testid selectors only; no coupling to Tailwind classes.
 */
import { test, expect } from '@playwright/test';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Seed an authenticated session in localStorage before the page loads. */
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

/** Clear any auth session from localStorage before the page loads. */
async function clearAuthSession(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    localStorage.removeItem('it.auth');
  });
}

/** Intercept the login API: success case. */
async function mockLoginSuccess(page: import('@playwright/test').Page) {
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ email: 'alice@example.com', displayName: 'Alice' }),
    }),
  );
}

/** Intercept the login API: 401 invalid credentials. */
async function mockLogin401(page: import('@playwright/test').Page) {
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({
        type: 'about:blank',
        title: 'Unauthorized',
        status: 401,
        detail: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
      }),
    }),
  );
}

/** Stub clients list so after login the /clients page renders without a live backend. */
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

// ── AC-1: Redirect unauthenticated visitor ─────────────────────────────────────

test.describe('AC-1: unauthenticated redirect to /login', () => {
  test('visiting / while unauthenticated redirects to /login', async ({ page }) => {
    await clearAuthSession(page);
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('visiting /clients while unauthenticated redirects to /login', async ({ page }) => {
    await clearAuthSession(page);
    await page.goto('/clients');
    await expect(page).toHaveURL(/\/login/);
  });

  test('LoginPage renders after redirect from /clients', async ({ page }) => {
    await clearAuthSession(page);
    await page.goto('/clients');
    await expect(page).toHaveURL(/\/login/);
    // Form is present
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[data-testid]')).toBeVisible();
  });
});

// ── AC-3: LoginPage structure ───────────────────────────────────────────────────

test.describe('AC-3: LoginPage renders all expected elements', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthSession(page);
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);
  });

  test('email and password fields are visible', async ({ page }) => {
    await expect(page.locator('#login-email')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
  });

  test('sign-in submit button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
  });

  test('Google sign-in button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible();
  });

  test('link to /register is present', async ({ page }) => {
    await expect(page.getByRole('link', { name: /create account/i })).toBeVisible();
  });

  test('link to /forgot-password is present', async ({ page }) => {
    await expect(page.getByRole('link', { name: /forgot password/i })).toBeVisible();
  });

  test('show/hide password toggle changes input type', async ({ page }) => {
    const passwordInput = page.locator('#login-password');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    // The show-password toggle button
    const toggle = page.getByRole('button', { name: /show password/i });
    await toggle.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
  });
});

// ── AC-4: Happy path — submit form → navigate to /clients ─────────────────────

test.describe('AC-4: email/password login happy path', () => {
  test('valid credentials → POST /api/v1/auth/login → land on original target (/clients)', async ({
    page,
  }) => {
    await clearAuthSession(page);
    await mockLoginSuccess(page);
    await mockClientsList(page);

    // Navigate to /clients first to set state.from
    await page.goto('/clients');
    await expect(page).toHaveURL(/\/login/);

    await page.locator('#login-email').fill('alice@example.com');
    await page.locator('#login-password').fill('Secret1!');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();

    // Should be redirected back to /clients
    await expect(page).toHaveURL(/\/clients/);
    await expect(page.getByTestId('clients-page')).toBeVisible();
  });

  test('valid credentials → POST /api/v1/auth/login → land on / when no state.from', async ({
    page,
  }) => {
    await clearAuthSession(page);
    await mockLoginSuccess(page);
    await mockClientsList(page);

    await page.goto('/login');
    await page.locator('#login-email').fill('alice@example.com');
    await page.locator('#login-password').fill('Secret1!');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();

    await expect(page).toHaveURL('/');
    await expect(page.getByTestId('home-page')).toBeVisible();
  });
});

// ── AC-4 error: 401 shows error toast ────────────────────────────────────────

test.describe('AC-4: 401 shows invalidCredentials toast', () => {
  test('wrong credentials → Sonner error toast is visible', async ({ page }) => {
    await clearAuthSession(page);
    await mockLogin401(page);
    await page.goto('/login');

    await page.locator('#login-email').fill('alice@example.com');
    await page.locator('#login-password').fill('WrongPass1!');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();

    // The toast from Sonner — Sonner renders in a [data-sonner-toaster] region
    const toast = page.locator('[data-sonner-toast]').first();
    await expect(toast).toBeVisible({ timeout: 5000 });
    await expect(toast).toContainText(/invalid email or password/i);
  });
});

// ── AC-2: Authenticated user visiting /login → redirect to / ─────────────────

test.describe('AC-2: PublicOnlyRoute bounces authenticated user off /login', () => {
  test('authenticated user visiting /login is redirected to /', async ({ page }) => {
    await seedAuthSession(page);
    await mockClientsList(page);
    await page.goto('/login');
    await expect(page).toHaveURL('/');
    await expect(page.getByTestId('home-page')).toBeVisible();
  });
});
