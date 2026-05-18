/**
 * AC-2: Verify that in dark mode, labels, headings, and key text on auth pages
 * and protected pages use the --color-foreground token (not near-black).
 *
 * A "near-black" colour is defined as rgb values where R, G, B are all < 50
 * (i.e., very close to rgb(0,0,0)).
 */
import { test, expect } from '@playwright/test';

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

function seedDarkMode(page: import('@playwright/test').Page) {
  return page.addInitScript(() => {
    localStorage.setItem('it.theme', JSON.stringify({ state: { theme: 'dark' }, version: 0 }));
  });
}

function stubClients(page: import('@playwright/test').Page) {
  return page.route('**/api/v1/clients**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 1 }),
    }),
  );
}

function stubDashboard(page: import('@playwright/test').Page) {
  return page.route('**/api/v1/dashboard**', async (route) => {
    const url = route.request().url();
    if (url.includes('expense-stats')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          from: '2024-01-01', to: '2024-12-31',
          grandTotal: '0.00', expenseByMonth: [], expenseByCategory: [],
        }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalInvoices: 0, draftCount: 0, sentCount: 0, paidCount: 0,
          totalRevenue: 0, paidRevenue: 0, pendingRevenue: 0, revenueByMonth: [],
        }),
      });
    }
  });
}

/** Parse "rgb(r, g, b)" or "rgba(r, g, b, a)" into {r, g, b}. */
function parseRgb(color: string): { r: number; g: number; b: number } | null {
  const m = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!m) return null;
  return { r: parseInt(m[1]!), g: parseInt(m[2]!), b: parseInt(m[3]!) };
}

/**
 * Returns true when the colour is "near-black" — all channels < 50.
 * In dark mode we must NOT see near-black text on dark surfaces.
 */
function isNearBlack(color: string): boolean {
  const rgb = parseRgb(color);
  if (!rgb) return false;
  return rgb.r < 50 && rgb.g < 50 && rgb.b < 50;
}

test.describe('dark-mode contrast — auth pages (unauthenticated)', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test.beforeEach(async ({ page }) => {
    // Seed dark mode only (no auth, so public routes load)
    await seedDarkMode(page);
  });

  test('/login: heading is not near-black in dark mode', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('h2');
    // Wait for dark class to be applied
    await expect(page.locator('html')).toHaveClass(/dark/, { timeout: 5000 });

    const headingColor = await page.evaluate(() => {
      const h2 = document.querySelector('h2');
      return h2 ? window.getComputedStyle(h2).color : null;
    });

    expect(headingColor).toBeTruthy();
    expect(isNearBlack(headingColor!)).toBe(false);
  });

  test('/register: heading is not near-black in dark mode', async ({ page }) => {
    await page.goto('/register');
    await page.waitForSelector('h2');
    await expect(page.locator('html')).toHaveClass(/dark/, { timeout: 5000 });

    const headingColor = await page.evaluate(() => {
      const h2 = document.querySelector('h2');
      return h2 ? window.getComputedStyle(h2).color : null;
    });

    expect(headingColor).toBeTruthy();
    expect(isNearBlack(headingColor!)).toBe(false);
  });

  test('/forgot-password: heading is not near-black in dark mode', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.waitForSelector('h2');
    await expect(page.locator('html')).toHaveClass(/dark/, { timeout: 5000 });

    const headingColor = await page.evaluate(() => {
      const h2 = document.querySelector('h2');
      return h2 ? window.getComputedStyle(h2).color : null;
    });

    expect(headingColor).toBeTruthy();
    expect(isNearBlack(headingColor!)).toBe(false);
  });

  test('/login: form labels are not near-black in dark mode', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('label');
    await expect(page.locator('html')).toHaveClass(/dark/, { timeout: 5000 });

    const labelColors = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('label')).map(
        (el) => window.getComputedStyle(el).color,
      );
    });

    // At least one label should exist
    expect(labelColors.length).toBeGreaterThan(0);
    // None should be near-black
    for (const color of labelColors) {
      expect(isNearBlack(color)).toBe(false);
    }
  });
});

test.describe('dark-mode contrast — protected pages', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await seedDarkMode(page);
    await stubClients(page);
    await stubDashboard(page);
  });

  test('/: dashboard heading is not near-black in dark mode', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="home-page"]');
    await expect(page.locator('html')).toHaveClass(/dark/, { timeout: 5000 });

    const headingColor = await page.evaluate(() => {
      const h1 = document.querySelector('h1, h2, [data-testid="home-page"] h1');
      return h1 ? window.getComputedStyle(h1).color : null;
    });

    // If heading not found, just ensure the page loaded with dark class
    if (headingColor) {
      expect(isNearBlack(headingColor)).toBe(false);
    }
  });

  test('/clients: page heading is not near-black in dark mode', async ({ page }) => {
    await page.goto('/clients');
    // Wait for the clients page to load (heading or empty state)
    await page.waitForSelector('[data-testid="clients-page"]', { timeout: 10000 });
    await expect(page.locator('html')).toHaveClass(/dark/, { timeout: 5000 });

    const headingColor = await page.evaluate(() => {
      const h = document.querySelector('h1, h2');
      return h ? window.getComputedStyle(h).color : null;
    });

    if (headingColor) {
      expect(isNearBlack(headingColor)).toBe(false);
    }
  });
});
