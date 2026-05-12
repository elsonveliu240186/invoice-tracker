/**
 * Smoke-regression spec: exercises the most-trafficked adjacent flow (/clients)
 * to catch regressions introduced by the design system feature.
 * AC-4: app renders without errors; AC-11: ClientsPage works within AppShell.
 */
import { test, expect } from '@playwright/test';

test.describe('smoke regression — clients flow', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('app loads at / without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    await page.waitForSelector('[data-testid="home-page"]');

    expect(errors).toHaveLength(0);
  });

  test('AppShell renders TopNav and Sidebar on home page', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="home-page"]');

    // TopNav header bar
    await expect(page.locator('header')).toBeVisible();

    // Sidebar
    await expect(page.getByTestId('desktop-sidebar')).toBeVisible();

    // ThemeToggle in TopNav
    await expect(page.getByRole('button', { name: /theme/i })).toBeVisible();
  });

  test('navigate to /clients — page renders inside AppShell', async ({ page }) => {
    await page.goto('/clients');
    await page.waitForSelector('[data-testid="clients-page"]');

    // AppShell wrapper still present
    await expect(page.getByTestId('desktop-sidebar')).toBeVisible();
    await expect(page.locator('header')).toBeVisible();

    // Clients page header
    await expect(page.getByRole('heading', { name: /clients/i })).toBeVisible();
  });

  test('New client button opens the client form dialog', async ({ page }) => {
    await page.goto('/clients');
    await page.waitForSelector('[data-testid="clients-page"]');

    await page.getByTestId('btn-new-client').click();

    // Dialog should open
    await expect(page.getByTestId('client-modal')).toBeVisible();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('client form modal can be closed', async ({ page }) => {
    await page.goto('/clients');
    await page.waitForSelector('[data-testid="clients-page"]');

    await page.getByTestId('btn-new-client').click();
    await expect(page.getByTestId('client-modal')).toBeVisible();

    // Close button inside dialog
    await page.getByTestId('modal-close').click();
    await expect(page.getByTestId('client-modal')).not.toBeVisible();
  });

  test('search input is visible and accepts input', async ({ page }) => {
    await page.goto('/clients');
    await page.waitForSelector('[data-testid="clients-page"]');

    const searchInput = page.getByTestId('search-input');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('test');
    await expect(searchInput).toHaveValue('test');
  });

  test('home page CTA link navigates to /clients', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="home-page"]');

    await page.getByTestId('link-clients').click();
    await expect(page).toHaveURL(/\/clients/);
    await expect(page.getByTestId('clients-page')).toBeVisible();
  });

  test('404 route renders not-found fallback without crashing', async ({ page }) => {
    await page.goto('/does-not-exist');

    // AppShell still renders
    await expect(page.locator('header')).toBeVisible();

    // Some not-found message visible
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toContain('Page not found');
  });

  test('back navigation from /clients to / works', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="home-page"]');

    await page.goto('/clients');
    await page.waitForSelector('[data-testid="clients-page"]');

    await page.goBack();
    await expect(page).toHaveURL('/');
    await expect(page.getByTestId('home-page')).toBeVisible();
  });
});
