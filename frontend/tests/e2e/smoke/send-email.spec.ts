/**
 * Smoke: seed client + invoice → navigate to invoice detail → click Send →
 * confirm dialog → success toast → MailHog receives 1 message with correct To
 */
import { test, expect } from '../fixtures/test';
import { InvoiceDetailPage } from '../pages/InvoiceDetailPage';
import { LoginPage } from '../pages/LoginPage';
import { getMailhogMessages } from '../fixtures/api';

test('send invoice → MailHog receives 1 message', async ({ page, factory }) => {
  const ts = Date.now();
  const clientEmail = `recipient-${ts}@e2e.test`;
  const client = await factory.createClient({ email: clientEmail });
  const invoice = await factory.createInvoice(client.id, {
    number: `SMOKE-SEND-${ts}`,
  });

  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(
    process.env['E2E_USERNAME'] ?? 'admin@example.com',
    process.env['E2E_PASSWORD'] ?? 'Secret1!',
  );
  await expect(page).toHaveURL('/', { timeout: 30000 });

  const detailPage = new InvoiceDetailPage(page);
  await detailPage.goto(invoice.id);

  await detailPage.clickSend();
  await detailPage.confirmSend();

  // Wait for success toast
  await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 30000 });

  // Poll MailHog for the message
  let messages: Awaited<ReturnType<typeof getMailhogMessages>> = [];
  for (let i = 0; i < 10; i++) {
    messages = await getMailhogMessages();
    if (messages.length > 0) break;
    await page.waitForTimeout(500);
  }

  expect(messages.length).toBeGreaterThanOrEqual(1);
  const msg = messages[0]!;
  const toAddresses = msg.To.map((t) => `${t.Mailbox}@${t.Domain}`);
  expect(toAddresses.some((addr) => addr.includes(clientEmail.split('@')[0]!))).toBeTruthy();
});
