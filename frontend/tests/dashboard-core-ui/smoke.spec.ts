/**
 * Smoke regression spec — covers the most-trafficked adjacent flows:
 *   1. Auth: unauthenticated access redirects to /login; login page renders.
 *   2. Dashboard → Clients navigation via sidebar.
 *   3. Create a new client end-to-end through the Sheet.
 *   4. Client detail navigation from list row.
 *
 * All backend calls are stubbed via page.route() — no live backend needed.
 * These tests check UI behaviour and do NOT need a real database.
 */
import { test, expect, type Page } from '@playwright/test';
import { loginAs } from './auth-helpers';

// ---------------------------------------------------------------------------
// Shared types & fixture factory
// ---------------------------------------------------------------------------

interface StubClient {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  companyName: string;
  companyAddress: string;
  companyVatNumber: string;
  companyIban: string;
  companySwiftBic: string;
  companyBankName: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

function makeClient(
  overrides: Partial<StubClient> & { id: string; name: string; email: string },
): StubClient {
  return {
    phone: null,
    address: null,
    companyName: '',
    companyAddress: '',
    companyVatNumber: '',
    companyIban: '',
    companySwiftBic: '',
    companyBankName: '',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    deletedAt: null,
    ...overrides,
  };
}

/**
 * Registers route stubs for the clients API with mutable state so POST/GET
 * interactions within a test reflect correctly.
 */
async function stubClientsApi(page: Page, initialClients: StubClient[]) {
  const clients = [...initialClients];

  await page.route('**/api/v1/clients**', (route) => {
    const url = new URL(route.request().url());
    const method = route.request().method();

    const pathParts = url.pathname.split('/').filter(Boolean);
    const clientId = pathParts.length === 4 ? pathParts[3] : null;

    if (clientId) {
      if (method === 'GET') {
        const client = clients.find((c) => c.id === clientId);
        if (client) {
          void route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(client),
          });
        } else {
          void route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({ status: 404, detail: 'Not found' }),
          });
        }
        return;
      }

      if (method === 'DELETE') {
        const idx = clients.findIndex((c) => c.id === clientId);
        if (idx !== -1) clients.splice(idx, 1);
        void route.fulfill({ status: 204 });
        return;
      }
    } else {
      if (method === 'GET') {
        void route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            content: clients,
            page: 0,
            size: 20,
            totalElements: clients.length,
            totalPages: clients.length === 0 ? 0 : 1,
          }),
        });
        return;
      }

      if (method === 'POST') {
        const body = route.request().postDataJSON() as Partial<StubClient>;
        const newClient: StubClient = makeClient({
          id: `client-created-${Date.now()}`,
          name: body.name ?? 'New Client',
          email: body.email ?? 'new@example.com',
          ...body,
        });
        clients.push(newClient);
        void route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newClient),
        });
        return;
      }
    }

    void route.continue();
  });
}

// ---------------------------------------------------------------------------
// Smoke — Auth guard
// ---------------------------------------------------------------------------

test.describe('Smoke — Auth guard', () => {
  test('unauthenticated access to / redirects to /login', async ({ page }) => {
    // Clear any existing auth state
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());

    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('login page renders sign-in form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    await expect(page.locator('#login-email')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
    // Use exact match to avoid resolving to the "Sign in with Google" button
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Smoke — Dashboard → Clients sidebar navigation
// ---------------------------------------------------------------------------

test.describe('Smoke — Dashboard → Clients sidebar navigation', () => {
  test('clicking Clients nav item navigates to /clients', async ({ page }) => {
    await stubClientsApi(page, [
      makeClient({ id: 'client-nav', name: 'Nav Test', email: 'nav@example.com' }),
    ]);
    await loginAs(page, { navigateTo: '/' });
    await page.setViewportSize({ width: 1280, height: 800 });

    // Click Clients in the sidebar
    const sidebar = page.locator('[aria-label="Sidebar navigation"]');
    await sidebar.locator('a[href="/clients"]').click();

    await expect(page).toHaveURL(/\/clients/);
    await expect(page.locator('[data-testid="clients-page"]')).toBeVisible();
  });

  test('clicking Dashboard nav item returns to /', async ({ page }) => {
    await stubClientsApi(page, []);
    await loginAs(page, { navigateTo: '/clients' });
    await page.setViewportSize({ width: 1280, height: 800 });

    const sidebar = page.locator('[aria-label="Sidebar navigation"]');
    await sidebar.locator('a[href="/"]').click();

    await expect(page).toHaveURL(/^http:\/\/localhost:\d+\/$/);
    await expect(page.locator('[data-testid="home-page"]')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Smoke — Create client end-to-end
// ---------------------------------------------------------------------------

test.describe('Smoke — Create client end-to-end', () => {
  test('creates a new client via the Sheet and sees it in the table', async ({ page }) => {
    // Start with empty list; POST stub will add the new client
    await stubClientsApi(page, []);
    await loginAs(page, { navigateTo: '/clients' });

    // Open create sheet
    await page.locator('[data-testid="btn-new-client"]').click();

    const sheet = page.locator('[data-testid="client-form-sheet"]');
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole('heading', { name: 'New client' })).toBeVisible();

    // Wait for form inputs to mount inside the Sheet before filling
    const nameInput = sheet.locator('[data-testid="input-name"]');
    const emailInput = sheet.locator('[data-testid="input-email"]');
    await expect(nameInput).toBeVisible({ timeout: 8000 });
    await nameInput.fill('Smoke Test Co');
    await emailInput.fill('smoke@example.com');

    // Submit via the form's submit button
    await sheet.locator('[data-testid="btn-submit"]').click();

    // Sheet closes and new row appears (list refetch returns the newly created client)
    await expect(sheet).not.toBeVisible();
    await expect(
      page.locator('[data-testid="client-row"]').filter({ hasText: 'Smoke Test Co' }),
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Smoke — Client detail navigation
// ---------------------------------------------------------------------------

test.describe('Smoke — Client detail navigation', () => {
  test('clicking a client row Edit button and navigating to detail via URL works', async ({
    page,
  }) => {
    const detailClient = makeClient({
      id: 'client-detail-smoke-001',
      name: 'Detail Smoke',
      email: 'detailsmoke@example.com',
    });

    await stubClientsApi(page, [detailClient]);
    await loginAs(page, { navigateTo: `/clients/${detailClient.id}` });

    await expect(page.locator('[data-testid="client-detail-page"]')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole('heading', { name: 'Detail Smoke' })).toBeVisible();
    await expect(page.locator('[data-testid="client-email"]')).toContainText(
      'detailsmoke@example.com',
    );
  });
});
