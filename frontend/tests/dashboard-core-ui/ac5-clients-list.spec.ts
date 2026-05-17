/**
 * AC-5: /clients uses shadcn Table with columns, server-side search, client-side
 *       status filter DropdownMenu, client-side pagination.
 */
import { test, expect } from '@playwright/test';
import { loginAs, seedClients } from './auth-helpers';

// Run all AC-5 list tests serially to avoid parallel backend-state conflicts
test.describe.serial('AC-5 — Clients list page', () => {
  test.beforeEach(async ({ page, request }) => {
    await seedClients(request, [
      { name: 'Acme Corp', email: 'acme@example.com' },
      { name: 'Globex', email: 'globex@example.com' },
    ]);
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
    // beforeEach already seeded Acme + Globex and navigated
    const searchInput = page.locator('[data-testid="search-input"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Acme');

    // Wait for debounced fetch / re-render — the component refetches on search change
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

    // All clients default to ACTIVE so filtering for INACTIVE yields empty state
    const emptyState = page.locator('[data-testid="empty-state"]');
    await expect(emptyState).toBeVisible();
  });
});

// Run pagination test serially to guarantee the 22-client seed is not clobbered by parallel tests
test.describe.serial('AC-5 — Pagination', () => {
  test('pagination controls appear when more than PAGE_SIZE clients exist', async ({
    page,
    request,
  }) => {
    // Seed 22 clients (PAGE_SIZE = 20 → 2 pages)
    const clients = Array.from({ length: 22 }, (_, i) => ({
      name: `Paginate Client ${String(i).padStart(2, '0')}`,
      email: `paginate${i}@example.com`,
    }));
    await seedClients(request, clients);
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
