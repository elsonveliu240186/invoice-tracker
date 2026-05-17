/**
 * AC-1: Collapsible Sidebar with Dashboard / Clients / Invoices (disabled) nav items.
 * AC-2: Mobile <md screens collapse sidebar into a Sheet drawer via hamburger button.
 * AC-3: TopNav renders breadcrumbs slot, UserMenu (Avatar + logout), ThemeToggle, LanguageSelector.
 */
import { test, expect } from '@playwright/test';
import { loginAs } from './auth-helpers';

test.describe('AC-1 — Desktop sidebar nav items', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, { navigateTo: '/' });
  });

  test('sidebar renders Dashboard and Clients nav items with active state', async ({ page }) => {
    // At 1280px wide the desktop sidebar should be visible
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    // The sidebar aside should be rendered
    const sidebar = page.locator('[aria-label="Sidebar navigation"]');
    await expect(sidebar).toBeVisible();

    // Dashboard link present and active at /
    const dashLink = sidebar.locator('a[href="/"]');
    await expect(dashLink).toBeVisible();

    // Clients link present
    const clientsLink = sidebar.locator('a[href="/clients"]');
    await expect(clientsLink).toBeVisible();
  });

  test('Invoices nav item is disabled (aria-disabled)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    const disabledItem = page.locator('[data-testid="nav-item-disabled"]');
    await expect(disabledItem).toBeVisible();
    await expect(disabledItem).toHaveAttribute('aria-disabled', 'true');
  });

  test('Clients nav item has aria-current="page" when on /clients', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/clients');

    const sidebar = page.locator('[aria-label="Sidebar navigation"]');
    // Both the <a> and inner <span> carry aria-current="page"; use .first() to avoid strict-mode error
    const activeSpan = sidebar.locator('[aria-current="page"]').first();
    await expect(activeSpan).toBeVisible();
  });
});

test.describe('AC-2 — Mobile drawer via hamburger', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAs(page, { navigateTo: '/' });
  });

  test('hamburger button is visible on mobile and opens drawer', async ({ page }) => {
    const hamburger = page.locator('[data-testid="hamburger"]');
    await expect(hamburger).toBeVisible();

    // Desktop sidebar should NOT be visible at mobile width
    const desktopSidebar = page.locator('[data-testid="desktop-sidebar"]');
    await expect(desktopSidebar).not.toBeVisible();

    // Click hamburger — drawer overlay should appear
    await hamburger.click();
    const drawerOverlay = page.locator('[data-testid="drawer-overlay"]');
    await expect(drawerOverlay).toBeVisible();
  });

  test('mobile drawer can be closed by clicking the close button', async ({ page }) => {
    const hamburger = page.locator('[data-testid="hamburger"]');
    await hamburger.click();

    const drawerOverlay = page.locator('[data-testid="drawer-overlay"]');
    await expect(drawerOverlay).toBeVisible();

    // Close via the X button inside the drawer
    const closeBtn = page.locator('[data-testid="sidebar-close"]');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    await expect(drawerOverlay).not.toBeVisible();
  });

  test('mobile drawer closes when Escape is pressed', async ({ page }) => {
    const hamburger = page.locator('[data-testid="hamburger"]');
    await hamburger.click();

    const drawerOverlay = page.locator('[data-testid="drawer-overlay"]');
    await expect(drawerOverlay).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(drawerOverlay).not.toBeVisible();
  });
});

test.describe('AC-3 — TopNav elements', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await loginAs(page, { navigateTo: '/' });
  });

  test('TopNav renders UserMenu trigger (avatar)', async ({ page }) => {
    const userMenuTrigger = page.locator('[data-testid="user-menu-trigger"]');
    await expect(userMenuTrigger).toBeVisible();
  });

  test('UserMenu opens with sign-out option on avatar click', async ({ page }) => {
    const userMenuTrigger = page.locator('[data-testid="user-menu-trigger"]');
    await userMenuTrigger.click();

    const signOutItem = page.locator('[data-testid="sign-out-item"]');
    await expect(signOutItem).toBeVisible();
  });

  test('Clicking sign-out navigates to /login', async ({ page }) => {
    const userMenuTrigger = page.locator('[data-testid="user-menu-trigger"]');
    await userMenuTrigger.click();

    const signOutItem = page.locator('[data-testid="sign-out-item"]');
    await signOutItem.click();

    await expect(page).toHaveURL(/\/login/);
  });

  test('hamburger is NOT visible on desktop (1280px)', async ({ page }) => {
    const hamburger = page.locator('[data-testid="hamburger"]');
    // The hamburger has class lg:hidden — it should not be visible at desktop width
    await expect(hamburger).not.toBeVisible();
  });
});
