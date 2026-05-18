/**
 * Smoke: create client via API → navigate to /clients → row visible
 */
import { test, expect } from '../fixtures/test';
import { ClientsPage } from '../pages/ClientsPage';
import { LoginPage } from '../pages/LoginPage';

test('seeded client appears in client list', async ({ page, factory }) => {
  const client = await factory.createClient({ name: 'Smoke Client Co' });

  // Log in as admin
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(
    process.env['E2E_USERNAME'] ?? 'admin@example.com',
    process.env['E2E_PASSWORD'] ?? 'Secret1!',
  );
  await expect(page).toHaveURL('/', { timeout: 10000 });

  // Navigate to clients
  const clientsPage = new ClientsPage(page);
  await clientsPage.goto();

  // Row with client name should be visible
  await expect(clientsPage.findRow(client.name)).toBeVisible({ timeout: 5000 });
});
