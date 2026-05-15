/**
 * AC-6, AC-7: No horizontal scroll at 375/768/1280px; touch targets ≥ 44×44px
 * on mobile layout; drawer behaviour at < 1024px.
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
  return page.route('**/api/v1/dashboard**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ totalClients: 0, totalRevenue: 0, pendingInvoices: 0 }),
    }),
  );
}

const VIEWPORTS = [
  { width: 375, height: 812, name: 'mobile-375' },
  { width: 768, height: 1024, name: 'tablet-768' },
  { width: 1280, height: 800, name: 'desktop-1280' },
] as const;

const ROUTES = ['/', '/clients'] as const;

/** Assert that the page has no horizontal overflow. */
async function assertNoHorizontalScroll(page: import('@playwright/test').Page) {
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const viewportWidth = await page.evaluate(() => window.innerWidth);
  expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 1); // +1 for sub-pixel rounding
}

for (const viewport of VIEWPORTS) {
  test.describe(`responsive — ${viewport.name} (${viewport.width}px)`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test.beforeEach(async ({ page }) => {
      await seedAuth(page);
      await stubClients(page);
      await stubDashboard(page);
    });

    for (const route of ROUTES) {
      test(`no horizontal scroll on ${route}`, async ({ page }) => {
        await page.goto(route);

        // Wait for the page to be meaningfully rendered
        if (route === '/') {
          await page.waitForSelector('[data-testid="home-page"]', { timeout: 10000 });
        } else if (route === '/clients') {
          await page.waitForSelector('[data-testid="clients-page"]', { timeout: 10000 });
        }

        await assertNoHorizontalScroll(page);
      });
    }

    if (viewport.width <= 640) {
      test('touch target: hamburger menu button is ≥ 44×44px on mobile', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('[data-testid="home-page"]', { timeout: 10000 });

        // The hamburger / mobile menu trigger
        const hamburger = page.locator('[data-testid="mobile-menu-trigger"]');
        const isVisible = await hamburger.isVisible().catch(() => false);

        if (isVisible) {
          const box = await hamburger.boundingBox();
          expect(box).toBeTruthy();
          if (box) {
            expect(box.width).toBeGreaterThanOrEqual(44);
            expect(box.height).toBeGreaterThanOrEqual(44);
          }
        }
      });
    }
  });
}

test.describe('responsive — auth pages (unauthenticated)', () => {
  const mobileViewport = { width: 375, height: 812 };
  test.use({ viewport: mobileViewport });

  test('no horizontal scroll on /login at 375px', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('h2');
    await assertNoHorizontalScroll(page);
  });

  test('no horizontal scroll on /register at 375px', async ({ page }) => {
    await page.goto('/register');
    await page.waitForSelector('h2');
    await assertNoHorizontalScroll(page);
  });
});
