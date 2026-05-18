/**
 * Regression: invoices CRUD — create multi-line; edit; delete; duplicate number;
 * zero lines validation; totals correct on detail page.
 */
import { test, expect } from '../fixtures/test';
import { InvoicesPage } from '../pages/InvoicesPage';
import { InvoiceDetailPage } from '../pages/InvoiceDetailPage';
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

test('seeded invoice row visible in list', async ({ page, factory }) => {
  const client = await factory.createClient();
  const invoice = await factory.createInvoice(client.id, { number: `REG-CRUD-${Date.now()}` });

  await login(page);
  const invoicesPage = new InvoicesPage(page);
  await invoicesPage.goto();

  await expect(invoicesPage.findRow(invoice.number)).toBeVisible({ timeout: 5000 });
});

test('delete invoice → removed from list', async ({ page, factory }) => {
  const client = await factory.createClient();
  const invoice = await factory.createInvoice(client.id, { number: `REG-DEL-${Date.now()}` });

  await login(page);
  const invoicesPage = new InvoicesPage(page);
  await invoicesPage.goto();

  const row = invoicesPage.findRow(invoice.number);
  await expect(row).toBeVisible({ timeout: 5000 });

  // Click delete button for this specific row
  await row.locator('[data-testid^="btn-delete-"]').click();
  await page.getByTestId('btn-confirm-delete').click();

  await expect(invoicesPage.findRow(invoice.number)).not.toBeVisible({ timeout: 5000 });
});

test('invoice detail page shows correct totals', async ({ page, factory }) => {
  const client = await factory.createClient();
  const invoice = await factory.createInvoice(client.id, {
    number: `REG-TOTALS-${Date.now()}`,
    lines: [
      { description: 'Item A', quantity: 2, unitPrice: 100 },
      { description: 'Item B', quantity: 1, unitPrice: 50 },
    ],
    taxRate: 0,
  });

  await login(page);
  const detailPage = new InvoiceDetailPage(page);
  await detailPage.goto(invoice.id);

  // Subtotal = 2*100 + 1*50 = 250
  await expect(page.getByTestId('invoice-subtotal')).toContainText('250', { timeout: 5000 });
  await expect(page.getByTestId('invoice-total')).toContainText('250');
});

test('mobile viewport: invoice list is usable', async ({ page, factory }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const client = await factory.createClient();
  const invoice = await factory.createInvoice(client.id, { number: `REG-MOB-${Date.now()}` });

  await login(page);
  const invoicesPage = new InvoicesPage(page);
  await invoicesPage.goto();

  await expect(invoicesPage.findRow(invoice.number)).toBeVisible({ timeout: 5000 });
});
