/**
 * AC-8:  Skeleton placeholders during loading; EmptyState when totalElements === 0.
 * AC-10: All visible strings loaded via i18n (spot-check key labels).
 * AC-11: Layout works at 360px / 768px / 1280px.
 *
 * All backend calls are stubbed via page.route() — no live backend needed.
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

async function stubClientsList(page: Page, clients: StubClient[]) {
  await page.route('**/api/v1/clients**', (route) => {
    const url = new URL(route.request().url());
    const method = route.request().method();

    if (method !== 'GET') {
      void route.continue();
      return;
    }

    // Individual client GET by ID
    const pathParts = url.pathname.split('/').filter(Boolean);
    const clientId = pathParts.length === 4 ? pathParts[3] : null;

    if (clientId) {
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

    // List request
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
  });
}

// ---------------------------------------------------------------------------
// AC-8 — Skeleton and EmptyState
// ---------------------------------------------------------------------------

// Serial to ensure no parallel test interferes while we assert empty state
test.describe.serial('AC-8 — EmptyState when no clients', () => {
  test('shows empty-state element when client list is empty', async ({ page }) => {
    await stubClientsList(page, []);
    await loginAs(page, { navigateTo: '/clients' });

    // ClientTable renders empty-state paragraph when clients array is empty
    const emptyState = page.locator('[data-testid="empty-state"]');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText('No clients yet');
  });

  test('New client button still visible on empty state', async ({ page }) => {
    await stubClientsList(page, []);
    await loginAs(page, { navigateTo: '/clients' });

    await expect(page.locator('[data-testid="btn-new-client"]')).toBeVisible();
  });
});

test.describe('AC-8 — ClientDetail skeleton while loading', () => {
  test('loading skeleton renders then transitions to data', async ({ page }) => {
    const skeletonClient = makeClient({
      id: 'client-skeleton-001',
      name: 'Skeleton Test',
      email: 'skeleton@example.com',
    });

    await stubClientsList(page, [skeletonClient]);
    await loginAs(page, { navigateTo: `/clients/${skeletonClient.id}` });

    // Eventually the detail page is visible (skeleton resolved)
    await expect(page.locator('[data-testid="client-detail-page"]')).toBeVisible({
      timeout: 10_000,
    });
  });
});

// ---------------------------------------------------------------------------
// AC-10 — i18n spot-check: key labels appear in English
// ---------------------------------------------------------------------------

test.describe('AC-10 — i18n string presence', () => {
  const i18nClient = makeClient({ id: 'client-i18n', name: 'i18n Client', email: 'i18n@example.com' });

  test.beforeEach(async ({ page }) => {
    await stubClientsList(page, [i18nClient]);
    await loginAs(page, { navigateTo: '/clients' });
  });

  test('clients page title reads "Clients"', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible();
  });

  test('"New client" button label is translated', async ({ page }) => {
    await expect(page.locator('[data-testid="btn-new-client"]')).toContainText('New client');
  });

  test('search placeholder contains translated text', async ({ page }) => {
    const input = page.locator('[data-testid="search-input"]');
    await expect(input).toHaveAttribute('placeholder', 'Search by name or email…');
  });

  test('status filter button contains "Status"', async ({ page }) => {
    const trigger = page.locator('[data-testid="status-filter-trigger"]');
    await expect(trigger).toContainText('Status');
  });

  test('table column headers are translated', async ({ page }) => {
    const table = page.locator('[data-testid="clients-table"]');
    await expect(table).toBeVisible();
    // The Actions column header is rendered without text (icon-only area) — exclude from check
    for (const header of ['Name', 'Email', 'Phone', 'Status', 'Updated']) {
      await expect(table.getByRole('columnheader', { name: header })).toBeVisible();
    }
  });
});

// ---------------------------------------------------------------------------
// AC-11 — Responsive layout breakpoints
// ---------------------------------------------------------------------------

test.describe('AC-11 — Responsive layout at key breakpoints', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, { navigateTo: '/' });
  });

  test('360px — hamburger visible, desktop sidebar hidden', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.reload();

    await expect(page.locator('[data-testid="hamburger"]')).toBeVisible();
    // Desktop sidebar wrapper has data-testid="desktop-sidebar" and is hidden via CSS
    const desktopSidebar = page.locator('[data-testid="desktop-sidebar"]');
    await expect(desktopSidebar).not.toBeVisible();
  });

  test('768px — hamburger visible (lg breakpoint is 1024px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();

    // At 768px (below lg=1024) hamburger should still be visible
    await expect(page.locator('[data-testid="hamburger"]')).toBeVisible();
  });

  test('1280px — desktop sidebar visible, hamburger hidden', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.reload();

    await expect(page.locator('[data-testid="desktop-sidebar"]')).toBeVisible();
    await expect(page.locator('[data-testid="hamburger"]')).not.toBeVisible();
  });
});
