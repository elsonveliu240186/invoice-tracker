/**
 * AC-6: Row "Edit" opens a slide-in Sheet with ClientForm; "Delete" opens AlertDialog.
 *       ClientFormModal is gone — only Sheet/AlertDialog exist.
 * AC-7: /clients/:id renders ClientDetailPage with Edit Sheet and Delete AlertDialog.
 */
import { test, expect } from '@playwright/test';
import { loginAs, seedClients } from './auth-helpers';

// ---------------------------------------------------------------------------
// AC-6 — Edit Sheet and Delete AlertDialog from the list page
// ---------------------------------------------------------------------------

// Run serially so seed state is deterministic between tests that mutate the backend
test.describe.serial('AC-6 — Edit Sheet from clients list', () => {
  test.beforeEach(async ({ page, request }) => {
    await seedClients(request, [
      { name: 'Acme Corp', email: 'acme@example.com' },
      { name: 'Globex', email: 'globex@example.com' },
    ]);
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

// Run serially so the shared backend state is deterministic across the group
test.describe.serial('AC-7 — ClientDetailPage', () => {
  let clientId: string;

  test.beforeEach(async ({ page, request }) => {
    // Seed one client and capture its ID from the API response
    const basicAuth = 'Basic ' + Buffer.from('admin:secret').toString('base64');

    // Clear existing
    const listResp = await request.get('http://localhost:8080/api/v1/clients?size=100', {
      headers: { Authorization: basicAuth },
    });
    const existing = (await listResp.json()) as { content: { id: string }[] };
    for (const c of existing.content) {
      await request.delete(`http://localhost:8080/api/v1/clients/${c.id}`, {
        headers: { Authorization: basicAuth },
      });
    }

    // Create fresh
    const createResp = await request.post('http://localhost:8080/api/v1/clients', {
      headers: { Authorization: basicAuth, 'Content-Type': 'application/json' },
      data: { name: 'Detail Client', email: 'detail@example.com', phone: '555-1234' },
    });
    const created = (await createResp.json()) as { id: string };
    clientId = created.id;

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
