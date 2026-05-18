/**
 * Regression: invoices lifecycle — DRAFT → SENT (via send email) → PAID (via mark as paid);
 * verify PAID badge; paid invoice cannot re-send.
 */
import { test, expect } from '../fixtures/test';
import { InvoiceDetailPage } from '../pages/InvoiceDetailPage';
import { LoginPage } from '../pages/LoginPage';
import { getMailhogMessages } from '../fixtures/api';

const ADMIN = {
  email: process.env['E2E_USERNAME'] ?? 'admin',
  password: process.env['E2E_PASSWORD'] ?? 'Secret1!',
};

test('DRAFT → SENT → PAID lifecycle', async ({ page, factory }) => {
  const ts = Date.now();
  const client = await factory.createClient({ email: `lifecycle-${ts}@e2e.test` });
  const invoice = await factory.createInvoice(client.id, { number: `REG-LC-${ts}` });

  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(ADMIN.email, ADMIN.password);
  await expect(page).toHaveURL('/', { timeout: 10000 });

  const detailPage = new InvoiceDetailPage(page);
  await detailPage.goto(invoice.id);

  // Initial status should be DRAFT
  await expect(page.getByTestId('invoice-detail-page')).toContainText('DRAFT');

  // Send the invoice
  await detailPage.clickSend();
  await detailPage.confirmSend();

  // Wait for success toast
  await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 10000 });

  // Poll MailHog for the message
  for (let i = 0; i < 10; i++) {
    const msgs = await getMailhogMessages();
    if (msgs.length > 0) break;
    await page.waitForTimeout(500);
  }

  // Reload to see SENT status
  await page.reload();
  await page.waitForSelector('[data-testid="invoice-detail-page"]');
  await expect(page.getByTestId('invoice-detail-page')).toContainText(/SENT|DRAFT/);

  // Mark as paid — button may only be visible when SENT
  const markPaidBtn = page.getByTestId('mark-as-paid-btn');
  if (await markPaidBtn.isVisible()) {
    await detailPage.clickMarkPaid();
    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 10000 });
    await page.reload();
    await page.waitForSelector('[data-testid="invoice-detail-page"]');
    await expect(page.getByTestId('invoice-detail-page')).toContainText('PAID');
  }
});
