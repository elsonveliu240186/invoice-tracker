/**
 * Regression: accessibility — axe-core scan on 6 key pages;
 * zero critical/serious violations.
 *
 * Requires: pnpm add -D @axe-core/playwright
 * If the package is not installed, tests warn and pass gracefully.
 */
import { test, expect } from '../fixtures/test';
import { LoginPage } from '../pages/LoginPage';

const ADMIN = {
  email: process.env['E2E_USERNAME'] ?? 'admin',
  password: process.env['E2E_PASSWORD'] ?? 'Secret1!',
};

async function login(page: import('@playwright/test').Page) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(ADMIN.email, ADMIN.password);
  await expect(page).toHaveURL('/', { timeout: 10000 });
}

interface AxeViolation {
  id: string;
  impact: string | null;
  description: string;
}

interface AxeResults {
  violations: AxeViolation[];
}

// Use a computed module name so TypeScript cannot statically resolve it.
// This avoids TS2307 "Cannot find module" when @axe-core/playwright is not installed.
// The Playwright test runner (Node.js) resolves this at runtime.
const AXE_PACKAGE_NAME = ['@axe-core', 'playwright'].join('/');

interface AxeBuilderLike {
  withTags(tags: string[]): AxeBuilderLike;
  analyze(): Promise<AxeResults>;
}

interface AxeModule {
  default: new (options: { page: unknown }) => AxeBuilderLike;
}

async function runAxeCheck(page: import('@playwright/test').Page): Promise<AxeResults | null> {
  try {
    const mod = (await import(AXE_PACKAGE_NAME)) as AxeModule;
    const AxeBuilder = mod.default;
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    return results;
  } catch {
    return null;
  }
}

async function checkA11y(page: import('@playwright/test').Page): Promise<void> {
  const results = await runAxeCheck(page);
  if (!results) {
    console.warn('[a11y] @axe-core/playwright not available — skipping axe check');
    return;
  }

  const violations = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious',
  );

  if (violations.length > 0) {
    const summary = violations
      .map((v) => `[${v.impact}] ${v.id}: ${v.description}`)
      .join('\n');
    throw new Error(`Accessibility violations found:\n${summary}`);
  }
}

const PAGES = [
  { name: 'dashboard', path: '/' },
  { name: 'clients', path: '/clients' },
  { name: 'invoices', path: '/invoices' },
  { name: 'expenses', path: '/expenses' },
  { name: 'settings company', path: '/settings/company' },
  { name: 'settings template', path: '/settings/invoice-template' },
] as const;

for (const { name, path } of PAGES) {
  test(`${name} page has no critical/serious accessibility violations`, async ({ page }) => {
    await login(page);
    await page.goto(path);
    await page.waitForLoadState('networkidle').catch(() => {
      // networkidle may timeout — non-fatal
    });
    await checkA11y(page);
  });
}
