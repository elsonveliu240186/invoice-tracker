/**
 * Extended Playwright test with per-test backend reset and MailHog purge.
 * Every spec using this extended test gets a clean DB state before each test.
 * After reset, re-registers the admin user so UI login tests work.
 */
import { test as base } from '@playwright/test';
import { TestDataFactory, getBasicAuthHeader } from './factory';
import { resetBackend, purgeMailhog, registerUser } from './api';

export { expect } from '@playwright/test';

const E2E_USERNAME = process.env['E2E_USERNAME'] ?? 'admin';
const E2E_PASSWORD = process.env['E2E_PASSWORD'] ?? 'Secret1!';

// Auto-fixture: runs reset + purge + re-register admin before every test.
// 'auto: true' ensures this runs regardless of whether the test requests 'factory'.
export const test = base.extend<{ factory: TestDataFactory; _reset: void }>({
  _reset: [
    async ({ request }, use) => {
      const authHeader = getBasicAuthHeader(E2E_USERNAME, E2E_PASSWORD);
      await resetBackend(request, authHeader);
      await purgeMailhog();
      // Re-register admin user after truncation (ignore 409 if it already exists)
      await registerUser(request, E2E_USERNAME, E2E_PASSWORD, 'Admin E2E');
      await use();
    },
    { auto: true },
  ],
  factory: async ({ request }, use) => {
    const authHeader = getBasicAuthHeader(E2E_USERNAME, E2E_PASSWORD);
    const factory = new TestDataFactory(request, authHeader);
    await use(factory);
  },
});
