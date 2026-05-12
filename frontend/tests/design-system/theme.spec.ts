/**
 * AC-5, AC-6: ThemeToggle cycles light→dark→system; <html> class toggles;
 *             preference persists across reload; keyboard accessible; aria-label present.
 */
import { test, expect } from '@playwright/test';

// Tests that need a clean (no persisted theme) starting state
test.describe('theme toggle — clean state', () => {
  test.beforeEach(async ({ page }) => {
    // Clear persisted theme before the initial load
    await page.addInitScript(() => {
      window.localStorage.removeItem('it.theme');
    });
    await page.goto('/');
    await page.waitForSelector('[data-testid="home-page"]');
  });

  test('AC-5: ThemeToggle button has aria-label', async ({ page }) => {
    const toggle = page.getByRole('button', { name: /theme/i });
    await expect(toggle).toBeVisible();
    const ariaLabel = await toggle.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
  });

  test('AC-5: clicking Dark sets dark class on <html>', async ({ page }) => {
    await page.getByRole('button', { name: /theme/i }).click();
    await page.getByRole('menuitem', { name: /dark/i }).click();

    const htmlClass = await page.evaluate(() => document.documentElement.className);
    expect(htmlClass).toContain('dark');
  });

  test('AC-5: clicking Light removes dark class from <html>', async ({ page }) => {
    // First switch to dark
    await page.getByRole('button', { name: /theme/i }).click();
    await page.getByRole('menuitem', { name: /dark/i }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Now switch to light
    await page.getByRole('button', { name: /theme/i }).click();
    await page.getByRole('menuitem', { name: /light/i }).click();

    const htmlClass = await page.evaluate(() => document.documentElement.className);
    expect(htmlClass).not.toContain('dark');
  });

  test('AC-5: theme cycles light → dark → system', async ({ page }) => {
    // Start in light
    await page.getByRole('button', { name: /theme/i }).click();
    await page.getByRole('menuitem', { name: /light/i }).click();

    // Switch to dark
    await page.getByRole('button', { name: /theme/i }).click();
    await page.getByRole('menuitem', { name: /dark/i }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Switch to system
    await page.getByRole('button', { name: /theme/i }).click();
    await page.getByRole('menuitem', { name: /system/i }).click();
    // system mode: just verify it was written — class depends on OS preference
    const stored = await page.evaluate(() => window.localStorage.getItem('it.theme'));
    expect(stored).toContain('system');
  });

  test('AC-6: ThemeToggle is keyboard accessible via Tab + Enter', async ({ page }) => {
    const toggle = page.getByRole('button', { name: /theme/i });
    await toggle.focus();
    await expect(toggle).toBeFocused();
    await toggle.press('Enter');
    // Dropdown menu should appear
    await expect(page.getByRole('menu')).toBeVisible();
    // Can navigate with arrow keys
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    // Menu should close
    await expect(page.getByRole('menu')).not.toBeVisible();
  });
});

// Persistence test uses its own isolated context — no addInitScript on reload
test.describe('theme toggle — persistence', () => {
  test('AC-5: theme preference persists across page reload', async ({ page }) => {
    // First visit: clear any stale state by navigating to the app and evaluating
    await page.goto('/');
    await page.waitForSelector('[data-testid="home-page"]');
    await page.evaluate(() => window.localStorage.removeItem('it.theme'));

    // Reload so the app starts fresh with no stored theme
    await page.reload();
    await page.waitForSelector('[data-testid="home-page"]');

    // Set to dark
    await page.getByRole('button', { name: /theme/i }).click();
    await page.getByRole('menuitem', { name: /dark/i }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Verify Zustand-persist wrote the key
    const stored = await page.evaluate(() => window.localStorage.getItem('it.theme'));
    expect(stored).toContain('dark');

    // Reload — the page starts fresh; Zustand onRehydrateStorage applies the class
    await page.reload();
    await page.waitForSelector('[data-testid="home-page"]');

    // The dark class must be present after rehydration
    const htmlClass = await page.evaluate(() => document.documentElement.className);
    expect(htmlClass).toContain('dark');
  });
});
