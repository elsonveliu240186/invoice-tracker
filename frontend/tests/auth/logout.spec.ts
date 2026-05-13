/**
 * Playwright E2E spec — Logout flow (FEAT-20260512-02)
 *
 * AC-11: "Sign out" action clears the store + localStorage and redirects to /login.
 *        After logout, navigating to protected routes redirects to /login again.
 *
 * API calls are intercepted via page.route() — no live backend required.
 */
import { test, expect } from '@playwright/test';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Seed an authenticated session in localStorage before the page loads.
 * Uses addInitScript so the session is present on the first navigation.
 */
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

/** Stub clients list so protected pages render without a live backend. */
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

// ── AC-11: Logout flow ────────────────────────────────────────────────────────

test.describe('AC-11: Sign out clears session and redirects to /login', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthSession(page);
    await mockClientsList(page);
  });

  test('user-menu trigger is visible when authenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('home-page')).toBeVisible();
    await expect(page.getByTestId('user-menu-trigger')).toBeVisible();
  });

  test('clicking Sign out in user menu redirects to /login', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('home-page')).toBeVisible();

    await page.getByTestId('user-menu-trigger').click();
    await expect(page.getByTestId('sign-out-item')).toBeVisible();
    await page.getByTestId('sign-out-item').click();

    await expect(page).toHaveURL(/\/login/);
  });

  test('after logout, localStorage no longer contains authenticated session', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('home-page')).toBeVisible();

    await page.getByTestId('user-menu-trigger').click();
    await page.getByTestId('sign-out-item').click();
    await expect(page).toHaveURL(/\/login/);

    // Check that the user field in the persisted store is null
    const storedRaw = await page.evaluate(() => localStorage.getItem('it.auth'));
    const stored = storedRaw ? (JSON.parse(storedRaw) as { state?: { user?: unknown } }) : null;
    expect(stored?.state?.user).toBeNull();
  });

  test('after logout, client-side navigation to /clients redirects to /login', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('home-page')).toBeVisible();

    await page.getByTestId('user-menu-trigger').click();
    await page.getByTestId('sign-out-item').click();
    await expect(page).toHaveURL(/\/login/);

    // Trigger a React Router navigation without a full page reload (which would
    // re-run addInitScript and re-seed localStorage).
    // pushState + popstate together is what react-router v7 listens for.
    await page.evaluate(() => {
      window.history.pushState({}, '', '/clients');
      window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
    });
    // ProtectedRoute sees unauthenticated store and redirects to /login.
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test('sign-out shows a success toast', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('home-page')).toBeVisible();

    await page.getByTestId('user-menu-trigger').click();
    await page.getByTestId('sign-out-item').click();

    // Toast from TopNav.handleSignOut
    const toast = page.locator('[data-sonner-toast]').first();
    await expect(toast).toBeVisible({ timeout: 5000 });
    await expect(toast).toContainText(/signed out/i);
  });
});

// ── AC-12: Auth state rehydrates from localStorage on reload ─────────────────

test.describe('AC-12: session persists across page reload', () => {
  test('reloading the page while authenticated keeps the user on /', async ({ page }) => {
    await seedAuthSession(page);
    await mockClientsList(page);

    await page.goto('/');
    await expect(page.getByTestId('home-page')).toBeVisible();

    await page.reload();
    // Should stay on / — ProtectedRoute sees the rehydrated session
    await expect(page).toHaveURL('/');
    await expect(page.getByTestId('home-page')).toBeVisible();
  });
});
