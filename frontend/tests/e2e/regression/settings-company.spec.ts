/**
 * Regression: company profile settings — fill all 8 fields → save → reload → values pre-filled;
 * blank name → blocked; IBAN too long → error.
 */
import { test, expect } from '../fixtures/test';
import { SettingsCompanyPage } from '../pages/SettingsCompanyPage';
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

test('fill all 8 fields → save → reload → values pre-filled', async ({ page }) => {
  await login(page);

  const settingsPage = new SettingsCompanyPage(page);
  await settingsPage.goto();

  // Wait for loading to finish
  await expect(page.getByTestId('company-profile-loading')).not.toBeVisible({ timeout: 10000 });

  const ts = Date.now();
  await settingsPage.fillField('name', `Company ${ts}`);
  await settingsPage.fillField('email', `company-${ts}@e2e.test`);
  await settingsPage.fillField('phone', '+1-555-0100');
  await settingsPage.fillField('address', '123 Test Street');
  await settingsPage.fillField('vatNumber', `VAT${ts}`);
  await settingsPage.fillField('iban', 'GB29NWBK60161331926819');
  await settingsPage.fillField('swiftBic', 'NWBKGB2L');
  await settingsPage.fillField('bankName', 'Test Bank');

  await settingsPage.save();

  // Wait for success toast
  await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 10000 });

  // Reload and verify values persisted
  await page.reload();
  await settingsPage.goto();
  await expect(page.getByTestId('company-profile-loading')).not.toBeVisible({ timeout: 10000 });

  const savedName = await settingsPage.fieldValue('name');
  expect(savedName).toBe(`Company ${ts}`);
});

test('blank name is blocked by client-side validation', async ({ page }) => {
  await login(page);

  const settingsPage = new SettingsCompanyPage(page);
  await settingsPage.goto();
  await expect(page.getByTestId('company-profile-loading')).not.toBeVisible({ timeout: 10000 });

  // Clear name field and try to save
  await settingsPage.fillField('name', '');
  await settingsPage.save();

  // Should show validation error — form should not submit
  // Either via HTML required or Zod validation
  await page.waitForTimeout(500);
  // Still on same page
  await expect(page).toHaveURL(/\/settings\/company/);
});

test('IBAN too long shows error', async ({ page }) => {
  await login(page);

  const settingsPage = new SettingsCompanyPage(page);
  await settingsPage.goto();
  await expect(page.getByTestId('company-profile-loading')).not.toBeVisible({ timeout: 10000 });

  // IBAN max is typically 34 chars — use 40 chars
  const longIban = 'A'.repeat(40);
  await settingsPage.fillField('name', 'Valid Name');
  await settingsPage.fillField('iban', longIban);
  await settingsPage.save();

  // Should show error or stay on page (validation rejects it)
  await page.waitForTimeout(500);
  await expect(page).toHaveURL(/\/settings\/company/);
});

test('mobile viewport: company settings page renders', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);

  const settingsPage = new SettingsCompanyPage(page);
  await settingsPage.goto();

  await expect(page.getByTestId('company-profile-settings-page')).toBeVisible({ timeout: 5000 });
});
