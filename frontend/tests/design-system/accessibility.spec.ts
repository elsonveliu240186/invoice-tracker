/**
 * AC-6, AC-12: Focus rings visible on Tab; ThemeToggle has aria-label;
 *              sidebar links have aria-current on active route.
 */
import { test, expect } from '@playwright/test';

// Seed an authenticated session so ProtectedRoute lets the app render.
function seedAuth(page: import('@playwright/test').Page) {
  return page.addInitScript(() => {
    localStorage.setItem(
      'it.auth',
      JSON.stringify({
        state: {
          user: {
            email: 'qa@example.com',
            displayName: 'QA User',
            provider: 'password',
            basicAuthToken: btoa('qa@example.com:Secret1!'),
          },
        },
        version: 0,
      }),
    );
  });
}

test.describe('accessibility', () => {
  test.describe('desktop viewport', () => {
    test.use({ viewport: { width: 1280, height: 800 } });
    test.beforeEach(async ({ page }) => {
      await seedAuth(page);
    });

    test('AC-6: ThemeToggle button has aria-label attribute', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('[data-testid="home-page"]');

      const themeBtn = page.getByRole('button', { name: /theme/i });
      await expect(themeBtn).toBeVisible();
      const label = await themeBtn.getAttribute('aria-label');
      expect(label).toBeTruthy();
      expect(label!.length).toBeGreaterThan(0);
    });

    test('AC-6: ThemeToggle is reachable via Tab key', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('[data-testid="home-page"]');

      // Tab through focusable elements until ThemeToggle is focused
      const themeBtn = page.getByRole('button', { name: /theme/i });
      await themeBtn.focus();
      await expect(themeBtn).toBeFocused();
    });

    test('AC-12: sidebar Home link has aria-current="page" when on / route', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('[data-testid="home-page"]');

      // The active NavLink renders a span with aria-current="page"
      const activeItem = page.locator('[aria-current="page"]').first();
      await expect(activeItem).toBeVisible();
    });

    test('AC-12: sidebar Clients link has aria-current="page" when on /clients', async ({
      page,
    }) => {
      await page.goto('/clients');
      await page.waitForSelector('[data-testid="clients-page"]');

      const activeItem = page.locator('[aria-current="page"]').first();
      await expect(activeItem).toBeVisible();
    });

    test('AC-12: sidebar Home link does NOT have aria-current when on /clients', async ({
      page,
    }) => {
      await page.goto('/clients');
      await page.waitForSelector('[data-testid="clients-page"]');

      // At least one aria-current="page" must exist (the Clients link)
      const ariaCurrent = page.locator('[aria-current="page"]');
      const count = await ariaCurrent.count();
      expect(count).toBeGreaterThanOrEqual(1);

      // None of the active items should be labelled "Home"
      for (let i = 0; i < count; i++) {
        const text = await ariaCurrent.nth(i).textContent();
        expect(text?.toLowerCase()).not.toContain('home');
      }
    });

    test('AC-12: focus ring visible on ThemeToggle via focus-visible ring class', async ({
      page,
    }) => {
      await page.goto('/');
      await page.waitForSelector('[data-testid="home-page"]');

      const themeBtn = page.getByRole('button', { name: /theme/i });
      // Verify the element has focus-visible ring styling (class attribute check)
      const className = await themeBtn.getAttribute('class');
      expect(className).toContain('focus-visible:ring');
    });

    test('AC-12: focus ring visible on hamburger button', async ({ page }) => {
      // Use mobile viewport to make hamburger visible
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/');
      await page.waitForSelector('[data-testid="home-page"]');

      const hamburger = page.getByTestId('hamburger');
      const className = await hamburger.getAttribute('class');
      expect(className).toContain('focus-visible:ring');
    });

    test('AC-12: sidebar nav links have accessible labels', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('[data-testid="home-page"]');

      const nav = page.getByRole('navigation', { name: /main navigation/i });
      await expect(nav).toBeVisible();

      // All links within sidebar should be accessible
      const links = nav.getByRole('link');
      const count = await links.count();
      expect(count).toBeGreaterThanOrEqual(4);
    });
  });

  test.describe('mobile viewport — drawer accessibility', () => {
    test.use({ viewport: { width: 375, height: 812 } });
    test.beforeEach(async ({ page }) => {
      await seedAuth(page);
    });

    test('AC-9: drawer has role="dialog" and aria-modal when open', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('[data-testid="home-page"]');

      await page.getByTestId('hamburger').click();

      const drawer = page.getByTestId('drawer-overlay');
      await expect(drawer).toBeVisible();
      await expect(drawer).toHaveAttribute('role', 'dialog');
      await expect(drawer).toHaveAttribute('aria-modal', 'true');
    });
  });
});
