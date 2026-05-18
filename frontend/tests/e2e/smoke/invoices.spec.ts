/**
 * Smoke: create client + invoice via API → navigate to /invoices → row visible → status DRAFT
 */
import { test, expect } from '../fixtures/test';
import { InvoicesPage } from '../pages/InvoicesPage';
import { LoginPage } from '../pages/LoginPage';

test('seeded invoice appears in list with DRAFT status', async ({ page, factory }) => {
  const client = await factory.createClient();
  const invoice = await factory.createInvoice(client.id, {
    number: `SMOKE-INV-${Date.now()}`,
  });

  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(
    process.env['E2E_USERNAME'] ?? 'admin@example.com',
    process.env['E2E_PASSWORD'] ?? 'Secret1!',
  );
  await expect(page).toHaveURL('/', { timeout: 10000 });

  const invoicesPage = new InvoicesPage(page);
  await invoicesPage.goto();

  const row = invoicesPage.findRow(invoice.number);
  await expect(row).toBeVisible({ timeout: 5000 });
  await expect(row).toContainText('DRAFT');
});
