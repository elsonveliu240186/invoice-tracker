/**
 * Smoke: upload valid .docx template → metadata filename visible
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { test, expect } from '../fixtures/test';
import { SettingsTemplatePage } from '../pages/SettingsTemplatePage';
import { LoginPage } from '../pages/LoginPage';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FIXTURE_FILE = path.resolve(
  __dirname,
  '../fixtures/files/sample-template.docx',
);

test('upload valid .docx template → filename visible in metadata', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(
    process.env['E2E_USERNAME'] ?? 'admin',
    process.env['E2E_PASSWORD'] ?? 'Secret1!',
  );
  await expect(page).toHaveURL('/', { timeout: 10000 });

  const templatePage = new SettingsTemplatePage(page);
  await templatePage.goto();

  await templatePage.uploadFile(FIXTURE_FILE);

  // Wait for success toast or metadata update
  await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 10000 });

  // Metadata filename should be visible
  await expect(templatePage.metadataFilename()).toBeVisible({ timeout: 10000 });
});
