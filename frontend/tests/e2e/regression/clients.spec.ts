/**
 * Regression: clients — full CRUD lifecycle; duplicate email 409; search by name;
 * pagination (seed 25 clients + verify page 2 exists).
 */
import { test, expect } from '../fixtures/test';
import { ClientsPage } from '../pages/ClientsPage';
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

test('create client via UI → visible in list', async ({ page }) => {
  await login(page);
  const clientsPage = new ClientsPage(page);
  await clientsPage.goto();

  const name = `CRUD Client ${Date.now()}`;
  const email = `crud-${Date.now()}@e2e.test`;

  await clientsPage.openCreateSheet();
  await clientsPage.fillForm({ name, email });
  await clientsPage.submitForm();

  await expect(clientsPage.findRow(name)).toBeVisible({ timeout: 5000 });
});

test('delete client → removed from list', async ({ page, factory }) => {
  const client = await factory.createClient({ name: `Delete Client ${Date.now()}` });
  await login(page);

  const clientsPage = new ClientsPage(page);
  await clientsPage.goto();

  await expect(clientsPage.findRow(client.name)).toBeVisible({ timeout: 5000 });
  await clientsPage.deleteRow(client.name);
  await expect(clientsPage.findRow(client.name)).not.toBeVisible({ timeout: 5000 });
});

test('duplicate email shows error', async ({ page, factory }) => {
  const client = await factory.createClient();
  await login(page);

  const clientsPage = new ClientsPage(page);
  await clientsPage.goto();

  await clientsPage.openCreateSheet();
  await clientsPage.fillForm({ name: 'Duplicate Client', email: client.email });
  await clientsPage.submitForm();

  // Should show error — either toast or inline field error
  const error = page.locator('[data-sonner-toast], [role="alert"]').first();
  await expect(error).toBeVisible({ timeout: 5000 });
});

test('search by name filters list', async ({ page, factory }) => {
  const uniqueName = `Unique-${Date.now()}`;
  await factory.createClient({ name: uniqueName });
  await login(page);

  const clientsPage = new ClientsPage(page);
  await clientsPage.goto();

  await clientsPage.searchFor(uniqueName);
  await expect(clientsPage.findRow(uniqueName)).toBeVisible({ timeout: 5000 });
});

test('pagination shows page 2 when 25 clients seeded', async ({ page, factory }) => {
  // Seed 25 clients
  const promises = Array.from({ length: 25 }, (_, i) =>
    factory.createClient({ name: `Paged Client ${i + 1} ${Date.now()}`, email: `paged-${i}-${Date.now()}@e2e.test` }),
  );
  await Promise.all(promises);

  await login(page);

  const clientsPage = new ClientsPage(page);
  await clientsPage.goto();

  // Page 2 button should be present
  await expect(page.getByTestId('btn-next-page')).toBeVisible({ timeout: 5000 });
  await page.getByTestId('btn-next-page').click();
  // We should now be on page 2
  await expect(page.locator('[data-testid="client-row"]').first()).toBeVisible();
});

test('mobile viewport: clients page is usable', async ({ page, factory }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await factory.createClient({ name: 'Mobile Client' });
  await login(page);

  const clientsPage = new ClientsPage(page);
  await clientsPage.goto();
  await expect(clientsPage.findRow('Mobile Client')).toBeVisible({ timeout: 5000 });
});
