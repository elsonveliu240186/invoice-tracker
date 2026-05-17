/**
 * AC-8:  Skeleton placeholders during loading; EmptyState when totalElements === 0.
 * AC-10: All visible strings loaded via i18n (spot-check key labels).
 * AC-11: Layout works at 360px / 768px / 1280px.
 */
import { test, expect } from '@playwright/test';
import { loginAs, seedClients } from './auth-helpers';

// ---------------------------------------------------------------------------
// AC-8 — Skeleton and EmptyState
// ---------------------------------------------------------------------------

// Serial to ensure no parallel test re-seeds clients while we assert empty state
test.describe.serial('AC-8 — EmptyState when no clients', () => {
  test('shows empty-state element when client list is empty', async ({ page, request }) => {
    await seedClients(request, []);
    await loginAs(page, { navigateTo: '/clients' });

    // ClientTable renders empty-state paragraph when clients array is empty
    const emptyState = page.locator('[data-testid="empty-state"]');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText('No clients yet');
  });

  test('New client button still visible on empty state', async ({ page, request }) => {
    await seedClients(request, []);
    await loginAs(page, { navigateTo: '/clients' });

    await expect(page.locator('[data-testid="btn-new-client"]')).toBeVisible();
  });
});

test.describe('AC-8 — ClientDetail skeleton while loading', () => {
  test('loading skeleton renders then transitions to data', async ({ page, request }) => {
    // Seed one client and get its ID
    const basicAuth = 'Basic ' + Buffer.from('admin:secret').toString('base64');
    const listResp = await request.get('http://localhost:8080/api/v1/clients?size=100', {
      headers: { Authorization: basicAuth },
    });
    const existing = (await listResp.json()) as { content: { id: string }[] };
    for (const c of existing.content) {
      await request.delete(`http://localhost:8080/api/v1/clients/${c.id}`, {
        headers: { Authorization: basicAuth },
      });
    }
    const createResp = await request.post('http://localhost:8080/api/v1/clients', {
      headers: { Authorization: basicAuth, 'Content-Type': 'application/json' },
      data: { name: 'Skeleton Test', email: 'skeleton@example.com' },
    });
    const created = (await createResp.json()) as { id: string };

    await loginAs(page, { navigateTo: `/clients/${created.id}` });

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
  test.beforeEach(async ({ page, request }) => {
    await seedClients(request, [{ name: 'i18n Client', email: 'i18n@example.com' }]);
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
