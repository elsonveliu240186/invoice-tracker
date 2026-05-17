/**
 * AC-6: Row "Edit" opens a slide-in Sheet with ClientForm; "Delete" opens AlertDialog.
 *       ClientFormModal is gone — only Sheet/AlertDialog exist.
 * AC-7: /clients/:id renders ClientDetailPage with Edit Sheet and Delete AlertDialog.
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

function makePageResponse(clients: StubClient[]) {
  return {
    content: clients,
    page: 0,
    size: 20,
    totalElements: clients.length,
    totalPages: 1,
  };
}

// ---------------------------------------------------------------------------
// Stub helpers
// ---------------------------------------------------------------------------

/**
 * Stub GET list, individual GET by ID, PUT (update), and DELETE for a mutable
 * client list. The list is held in a local array so mutations are reflected.
 */
async function stubClientsApi(page: Page, initialClients: StubClient[]) {
  // Mutable copy so update/delete can mutate state for subsequent requests
  const clients = [...initialClients];

  await page.route('**/api/v1/clients**', (route) => {
    const url = new URL(route.request().url());
    const method = route.request().method();

    // Extract path segments to detect /clients/:id vs /clients
    const pathParts = url.pathname.split('/').filter(Boolean);
    // pathParts: ['api', 'v1', 'clients'] or ['api', 'v1', 'clients', ':id']
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
          void route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ status: 404, detail: 'Not found' }) });
        }
        return;
      }

      if (method === 'PUT') {
        const body = route.request().postDataJSON() as Partial<StubClient>;
        const idx = clients.findIndex((c) => c.id === clientId);
        if (idx !== -1) {
          clients[idx] = { ...clients[idx]!, ...body };
          void route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(clients[idx]),
          });
        } else {
          void route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
        }
        return;
      }

      if (method === 'DELETE') {
        const idx = clients.findIndex((c) => c.id === clientId);
        if (idx !== -1) {
          clients.splice(idx, 1);
        }
        void route.fulfill({ status: 204 });
        return;
      }
    } else {
      // List or POST
      if (method === 'GET') {
        const searchQuery = url.searchParams.get('query') ?? '';
        let filtered = clients;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          filtered = clients.filter(
            (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
          );
        }
        void route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(makePageResponse(filtered)),
        });
        return;
      }

      if (method === 'POST') {
        const body = route.request().postDataJSON() as Partial<StubClient>;
        const newClient: StubClient = makeClient({
          id: `client-new-${Date.now()}`,
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
// Test data
// ---------------------------------------------------------------------------

const ACME = makeClient({ id: 'client-acme', name: 'Acme Corp', email: 'acme@example.com' });
const GLOBEX = makeClient({ id: 'client-globex', name: 'Globex', email: 'globex@example.com' });
const DETAIL_CLIENT = makeClient({
  id: 'client-detail-001',
  name: 'Detail Client',
  email: 'detail@example.com',
  phone: '555-1234',
});

// ---------------------------------------------------------------------------
// AC-6 — Edit Sheet and Delete AlertDialog from the list page
// ---------------------------------------------------------------------------

test.describe.serial('AC-6 — Edit Sheet from clients list', () => {
  test.beforeEach(async ({ page }) => {
    await stubClientsApi(page, [ACME, GLOBEX]);
    await loginAs(page, { navigateTo: '/clients' });
    await expect(page.locator('[data-testid="clients-table"]')).toBeVisible();
  });

  test('clicking Edit on first row opens the ClientFormSheet', async ({ page }) => {
    const firstEditBtn = page.locator('[data-testid="btn-edit"]').first();
    await firstEditBtn.click();

    const sheet = page.locator('[data-testid="client-form-sheet"]');
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole('heading', { name: 'Edit client' })).toBeVisible();
  });

  test('ClientFormSheet is pre-filled with the client name', async ({ page }) => {
    const firstEditBtn = page.locator('[data-testid="btn-edit"]').first();
    await firstEditBtn.click();

    const sheet = page.locator('[data-testid="client-form-sheet"]');
    await expect(sheet).toBeVisible();

    // Wait for the form input to be mounted and filled (Sheet renders form only when open=true)
    const nameInput = sheet.locator('[data-testid="input-name"]');
    await expect(nameInput).toBeVisible({ timeout: 8000 });
    await expect(nameInput).toHaveValue('Acme Corp');
  });

  test('updating a client name via the Sheet reflects in the table', async ({ page }) => {
    const firstEditBtn = page.locator('[data-testid="btn-edit"]').first();
    await firstEditBtn.click();

    const sheet = page.locator('[data-testid="client-form-sheet"]');
    await expect(sheet).toBeVisible();

    // Wait for the form input to be mounted before interacting
    const nameInput = sheet.locator('[data-testid="input-name"]');
    await expect(nameInput).toBeVisible({ timeout: 8000 });
    await nameInput.clear();
    await nameInput.fill('Acme Corp Updated');

    // Submit form via the submit button (data-testid="btn-submit")
    await sheet.locator('[data-testid="btn-submit"]').click();

    // Sheet should close and the updated row should appear in the table
    await expect(sheet).not.toBeVisible();
    await expect(
      page.locator('[data-testid="client-row"]').filter({ hasText: 'Acme Corp Updated' }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('clicking Delete on first row opens the confirm AlertDialog', async ({ page }) => {
    const firstDeleteBtn = page.locator('[data-testid="btn-delete"]').first();
    await firstDeleteBtn.click();

    const dialog = page.locator('[data-testid="confirm-delete-dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Delete client' })).toBeVisible();
  });

  test('cancelling Delete dialog does not remove the row', async ({ page }) => {
    const rowsBefore = await page.locator('[data-testid="client-row"]').count();

    const firstDeleteBtn = page.locator('[data-testid="btn-delete"]').first();
    await firstDeleteBtn.click();

    const dialog = page.locator('[data-testid="confirm-delete-dialog"]');
    await expect(dialog).toBeVisible();

    await page.locator('[data-testid="btn-cancel-delete"]').click();
    await expect(dialog).not.toBeVisible();

    const rowsAfter = await page.locator('[data-testid="client-row"]').count();
    expect(rowsAfter).toBe(rowsBefore);
  });

  test('confirming Delete removes the row from the table', async ({ page }) => {
    // Wait for rows to stabilize before counting
    const rows = page.locator('[data-testid="client-row"]');
    await expect(rows).toHaveCount(2);

    const firstDeleteBtn = page.locator('[data-testid="btn-delete"]').first();
    await firstDeleteBtn.click();

    const dialog = page.locator('[data-testid="confirm-delete-dialog"]');
    await expect(dialog).toBeVisible();

    await page.locator('[data-testid="btn-confirm-delete"]').click();
    await expect(dialog).not.toBeVisible();

    // Wait for the refetch to complete — table should now have 1 row
    await expect(rows).toHaveCount(1, { timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// AC-7 — ClientDetailPage at /clients/:id
// ---------------------------------------------------------------------------

test.describe.serial('AC-7 — ClientDetailPage', () => {
  const clientId = DETAIL_CLIENT.id;

  test.beforeEach(async ({ page }) => {
    await stubClientsApi(page, [DETAIL_CLIENT]);
    await loginAs(page, { navigateTo: `/clients/${clientId}` });
    // Wait for the loading skeleton to resolve to the full detail page
    await expect(page.locator('[data-testid="client-detail-page"]')).toBeVisible({
      timeout: 10_000,
    });
  });

  test('renders client detail page', async ({ page }) => {
    await expect(page.locator('[data-testid="client-detail-page"]')).toBeVisible();
  });

  test('shows client name as heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Detail Client' })).toBeVisible();
  });

  test('shows email, phone in contact card', async ({ page }) => {
    await expect(page.locator('[data-testid="client-email"]')).toContainText('detail@example.com');
    await expect(page.locator('[data-testid="client-phone"]')).toContainText('555-1234');
  });

  test('back-to-clients link is present', async ({ page }) => {
    const backLink = page.locator('[data-testid="link-back-to-clients"]');
    await expect(backLink).toBeVisible();
  });

  test('Edit button opens ClientFormSheet with pre-filled data', async ({ page }) => {
    await page.locator('[data-testid="btn-edit-client"]').click();

    const sheet = page.locator('[data-testid="client-form-sheet"]');
    await expect(sheet).toBeVisible();
    // Wait for the form input to be mounted inside the Sheet
    const nameInput = sheet.locator('[data-testid="input-name"]');
    await expect(nameInput).toBeVisible({ timeout: 8000 });
    await expect(nameInput).toHaveValue('Detail Client');
  });

  test('Delete button opens confirm AlertDialog', async ({ page }) => {
    await page.locator('[data-testid="btn-delete-client"]').click();

    const dialog = page.locator('[data-testid="confirm-delete-dialog"]');
    await expect(dialog).toBeVisible();
  });

  test('confirming delete navigates back to /clients', async ({ page }) => {
    await page.locator('[data-testid="btn-delete-client"]').click();

    const dialog = page.locator('[data-testid="confirm-delete-dialog"]');
    await expect(dialog).toBeVisible();
    await page.locator('[data-testid="btn-confirm-delete"]').click();

    await expect(page).toHaveURL(/\/clients$/);
  });

  test('unknown client ID renders not-found message', async ({ page }) => {
    await loginAs(page, { navigateTo: '/clients/does-not-exist-uuid' });
    await expect(page.locator('[data-testid="client-detail-not-found"]')).toBeVisible();
    await expect(page.locator('[data-testid="link-back-to-clients"]')).toBeVisible();
  });
});
