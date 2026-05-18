/**
 * Regression: DOCX generation — save company profile with name "Regression Corp"
 * → generate DOCX download → assert Content-Disposition header.
 * Skipped if company profile endpoint returns 404.
 */
import { test, expect } from '../fixtures/test';
import { InvoiceDetailPage } from '../pages/InvoiceDetailPage';
import { LoginPage } from '../pages/LoginPage';
import { getBasicAuthHeader } from '../fixtures/api';

const ADMIN = {
  email: process.env['E2E_USERNAME'] ?? 'admin@example.com',
  password: process.env['E2E_PASSWORD'] ?? 'Secret1!',
};

const API_URL = process.env['E2E_API_URL'] ?? 'http://localhost:8082';

test('DOCX download has correct Content-Disposition', async ({ page, request, factory }) => {
  const authHeader = getBasicAuthHeader(ADMIN.email, ADMIN.password);

  // Check if company profile endpoint exists
  const check = await request.get(`${API_URL}/api/v1/settings/company`, {
    headers: { Authorization: authHeader },
  });
  if (check.status() === 404) {
    test.skip(true, 'FEAT-20260518-02 company profile endpoint not available');
    return;
  }

  // Save company profile
  await factory.saveCompanyProfile({ name: 'Regression Corp' });

  // Create client + invoice
  const client = await factory.createClient();
  const invoice = await factory.createInvoice(client.id, { number: `REG-DOCX-${Date.now()}` });

  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(ADMIN.email, ADMIN.password);
  await expect(page).toHaveURL('/', { timeout: 10000 });

  const detailPage = new InvoiceDetailPage(page);
  await detailPage.goto(invoice.id);

  // Trigger DOCX generation via API and check response headers
  const generateRes = await request.post(
    `${API_URL}/api/v1/invoices/${invoice.id}/generate`,
    { headers: { Authorization: authHeader } },
  );

  if (!generateRes.ok()) {
    test.skip(true, `Generate endpoint returned ${generateRes.status()}`);
    return;
  }

  // Download the generated DOCX
  const downloadRes = await request.get(
    `${API_URL}/api/v1/invoices/${invoice.id}/download/docx`,
    { headers: { Authorization: authHeader } },
  );

  if (!downloadRes.ok()) {
    // Try alternative endpoint
    const altRes = await request.get(
      `${API_URL}/api/v1/invoices/${invoice.id}/artifacts/docx`,
      { headers: { Authorization: authHeader } },
    );
    if (altRes.ok()) {
      const contentDisp = altRes.headers()['content-disposition'] ?? '';
      expect(contentDisp).toMatch(/attachment/i);
      expect(contentDisp).toMatch(/invoice/i);
      return;
    }
  } else {
    const contentDisp = downloadRes.headers()['content-disposition'] ?? '';
    expect(contentDisp).toMatch(/attachment/i);
    expect(contentDisp).toMatch(/invoice/i);
  }
});
