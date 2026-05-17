/**
 * AC-5: /clients uses shadcn Table with columns, server-side search, client-side
 *       status filter DropdownMenu, client-side pagination.
 *
 * All backend calls are stubbed via page.route() — no live backend needed.
 */
import { test, expect, type Page } from '@playwright/test';
import { loginAs } from './auth-helpers';

// ---------------------------------------------------------------------------
// Stub helpers
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

function makeClient(overrides: Partial<StubClient> & { id: string; name: string; email: string }): StubClient {
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
 * Registers a page.route() stub for GET /api/v1/clients**.
 * The handler inspects the `query` search param to simulate server-side filtering.
 */
async function stubClientsList(page: Page, clients: StubClient[]) {
  await page.route('**/api/v1/clients**', (route) => {
    const url = new URL(route.request().url());
    const method = route.request().method();

    // Only handle GET requests on this stub
    if (method !== 'GET') {
      void route.continue();
      return;
    }

    const searchQuery = url.searchParams.get('query') ?? '';
    const pageNum = parseInt(url.searchParams.get('page') ?? '0', 10);
    const size = parseInt(url.searchParams.get('size') ?? '20', 10);

    let filtered = clients;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = clients.filter(
        (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
      );
    }

    const start = pageNum * size;
    const pageContent = filtered.slice(start, start + size);

    void route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        content: pageContent,
        page: pageNum,
        size,
        totalElements: filtered.length,
        totalPages: Math.ceil(filtered.length / size),
      }),
    });
  });
}

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const ACME = makeClient({ id: 'client-acme', name: 'Acme Corp', email: 'acme@example.com' });
const GLOBEX = makeClient({ id: 'client-globex', name: 'Globex', email: 'globex@example.com' });

// ---------------------------------------------------------------------------
// AC-5 list tests
// ---------------------------------------------------------------------------

test.describe.serial('AC-5 — Clients list page', () => {
  test.beforeEach(async ({ page }) => {
    await stubClientsList(page, [ACME, GLOBEX]);
    await loginAs(page, { navigateTo: '/clients' });
    // Wait for table to be ready before each test
    await expect(page.locator('[data-testid="clients-table"]')).toBeVisible();
  });

  test('renders clients-page container', async ({ page }) => {
    await expect(page.locator('[data-testid="clients-page"]')).toBeVisible();
  });

  test('renders shadcn Table with correct column headers', async ({ page }) => {
    const table = page.locator('[data-testid="clients-table"]');
    await expect(table.getByRole('columnheader', { name: 'Name' })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: 'Email' })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: 'Phone' })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: 'Status' })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: 'Updated' })).toBeVisible();
    // The Actions column header is rendered without text (icon-only area) — skip text check
  });

  test('renders two client rows', async ({ page }) => {
    const rows = page.locator('[data-testid="client-row"]');
    await expect(rows).toHaveCount(2);
  });

  test('New client button is present', async ({ page }) => {
    const btn = page.locator('[data-testid="btn-new-client"]');
    await expect(btn).toBeVisible();
  });

  test('search input filters results — type "Acme" returns one row', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Acme');

    // Wait for debounced fetch / re-render — the stub returns only Acme for query=Acme
    await expect(page.locator('[data-testid="client-row"]')).toHaveCount(1, { timeout: 8000 });
    await expect(page.locator('[data-testid="client-row"]').first()).toContainText('Acme Corp');
  });

  test('status filter dropdown is present and opens', async ({ page }) => {
    const trigger = page.locator('[data-testid="status-filter-trigger"]');
    await expect(trigger).toBeVisible();
    await trigger.click();
    await expect(page.locator('[data-testid="filter-all"]')).toBeVisible();
    await expect(page.locator('[data-testid="filter-active"]')).toBeVisible();
    await expect(page.locator('[data-testid="filter-inactive"]')).toBeVisible();
  });

  test('selecting "Inactive" status filter shows no rows (all clients derive ACTIVE)', async ({
    page,
  }) => {
    const trigger = page.locator('[data-testid="status-filter-trigger"]');
    await trigger.click();
    await page.locator('[data-testid="filter-inactive"]').click();

    // All clients default to ACTIVE (deletedAt=null) so filtering for INACTIVE yields empty state
    const emptyState = page.locator('[data-testid="empty-state"]');
    await expect(emptyState).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// AC-5 — Pagination
// ---------------------------------------------------------------------------

test.describe.serial('AC-5 — Pagination', () => {
  test('pagination controls appear when more than PAGE_SIZE clients exist', async ({ page }) => {
    // Stub 22 clients so totalPages = 2 (PAGE_SIZE = 20)
    const clients = Array.from({ length: 22 }, (_, i) =>
      makeClient({
        id: `paginate-client-${i}`,
        name: `Paginate Client ${String(i).padStart(2, '0')}`,
        email: `paginate${i}@example.com`,
      }),
    );

    await stubClientsList(page, clients);
    await loginAs(page, { navigateTo: '/clients' });

    // Wait for table to render before checking pagination
    await expect(page.locator('[data-testid="clients-table"]')).toBeVisible({ timeout: 10_000 });

    const prevBtn = page.locator('[data-testid="btn-prev-page"]');
    const nextBtn = page.locator('[data-testid="btn-next-page"]');
    await expect(prevBtn).toBeVisible({ timeout: 10_000 });
    await expect(nextBtn).toBeVisible({ timeout: 10_000 });

    // Previous should be disabled on page 1
    await expect(prevBtn).toBeDisabled();
    // Next should be enabled
    await expect(nextBtn).not.toBeDisabled();

    // Navigate to page 2
    await nextBtn.click();
    await expect(prevBtn).not.toBeDisabled();
    await expect(nextBtn).toBeDisabled();
  });
});
