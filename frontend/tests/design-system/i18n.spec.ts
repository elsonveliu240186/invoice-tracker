/**
 * AC-8: i18n bootstraps; English strings render (not raw keys like `common.appName`).
 */
import { test, expect } from '@playwright/test';

test.describe('i18n — English strings', () => {
  test('AC-8: app name renders as "Invoice Tracker" not raw key', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="home-page"]');

    // The sidebar header and/or TopNav avatar text should show "Invoice Tracker"
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).not.toContain('common.appName');
    expect(bodyText).toContain('Invoice Tracker');
  });

  test('AC-8: nav labels render as English words not translation keys', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="home-page"]');

    const bodyText = await page.locator('body').textContent();
    expect(bodyText).not.toMatch(/nav\.(home|clients|invoices|settings)/);
    expect(bodyText).toContain('Home');
    expect(bodyText).toContain('Clients');
    expect(bodyText).toContain('Invoices');
    expect(bodyText).toContain('Settings');
  });

  test('AC-8: home page title renders from i18n key', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="home-page"]');

    await expect(page.getByRole('heading', { name: /welcome to invoice tracker/i })).toBeVisible();
  });

  test('AC-8: home page CTA link renders English label', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="home-page"]');

    await expect(page.getByTestId('link-clients')).toBeVisible();
    await expect(page.getByTestId('link-clients')).toHaveText('Manage Clients');
  });

  test('AC-8: clients page header renders English title', async ({ page }) => {
    await page.goto('/clients');
    await page.waitForSelector('[data-testid="clients-page"]');

    const bodyText = await page.locator('body').textContent();
    expect(bodyText).not.toContain('clients.title');
    expect(bodyText).toContain('Clients');
  });

  test('AC-8: no raw i18n keys visible anywhere on home page', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="home-page"]');

    const bodyText = await page.locator('body').textContent();
    // Keys use dot notation — none should be visible as-is
    expect(bodyText).not.toMatch(/\b(common|nav|home|clients|errors)\.\w+/);
  });
});
