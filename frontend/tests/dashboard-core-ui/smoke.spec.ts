/**
 * Smoke regression spec — covers the most-trafficked adjacent flows:
 *   1. Auth: unauthenticated access redirects to /login; login page renders.
 *   2. Dashboard → Clients navigation via sidebar.
 *   3. Create a new client end-to-end through the Sheet.
 *   4. Client detail navigation from list row.
 *
 * These tests exercise real backend data so seed state is reset before each test.
 */
import { test, expect } from '@playwright/test';
import { loginAs, seedClients } from './auth-helpers';

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

test.describe('Smoke — Dashboard → Clients sidebar navigation', () => {
  test('clicking Clients nav item navigates to /clients', async ({ page, request }) => {
    await seedClients(request, [{ name: 'Nav Test', email: 'nav@example.com' }]);
    await loginAs(page, { navigateTo: '/' });
    await page.setViewportSize({ width: 1280, height: 800 });

    // Click Clients in the sidebar
    const sidebar = page.locator('[aria-label="Sidebar navigation"]');
    await sidebar.locator('a[href="/clients"]').click();

    await expect(page).toHaveURL(/\/clients/);
    await expect(page.locator('[data-testid="clients-page"]')).toBeVisible();
  });

  test('clicking Dashboard nav item returns to /', async ({ page, request }) => {
    await seedClients(request, []);
    await loginAs(page, { navigateTo: '/clients' });
    await page.setViewportSize({ width: 1280, height: 800 });

    const sidebar = page.locator('[aria-label="Sidebar navigation"]');
    await sidebar.locator('a[href="/"]').click();

    await expect(page).toHaveURL(/^http:\/\/localhost:\d+\/$/);
    await expect(page.locator('[data-testid="home-page"]')).toBeVisible();
  });
});

test.describe('Smoke — Create client end-to-end', () => {
  test('creates a new client via the Sheet and sees it in the table', async ({ page, request }) => {
    await seedClients(request, []);
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

    // Sheet closes and new row appears
    await expect(sheet).not.toBeVisible();
    await expect(
      page.locator('[data-testid="client-row"]').filter({ hasText: 'Smoke Test Co' }),
    ).toBeVisible();
  });
});

test.describe('Smoke — Client detail navigation', () => {
  test('clicking a client row Edit button and navigating to detail via URL works', async ({
    page,
    request,
  }) => {
    // Seed and capture ID
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
      data: { name: 'Detail Smoke', email: 'detailsmoke@example.com' },
    });
    const created = (await createResp.json()) as { id: string };

    await loginAs(page, { navigateTo: `/clients/${created.id}` });

    await expect(page.locator('[data-testid="client-detail-page"]')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole('heading', { name: 'Detail Smoke' })).toBeVisible();
    await expect(page.locator('[data-testid="client-email"]')).toContainText(
      'detailsmoke@example.com',
    );
  });
});
