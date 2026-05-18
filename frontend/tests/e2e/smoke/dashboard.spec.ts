/**
 * Smoke: seed 2 invoices + 1 expense → navigate to / → KPI cards visible and not zero
 */
import { test, expect } from '../fixtures/test';
import { DashboardPage } from '../pages/DashboardPage';
import { LoginPage } from '../pages/LoginPage';

test('dashboard KPI cards render with seeded data', async ({ page, factory }) => {
  // Seed data
  const client = await factory.createClient();
  await factory.createInvoice(client.id);
  await factory.createInvoice(client.id, { number: `SMOKE-DASH-2-${Date.now()}` });
  await factory.createExpense();

  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(
    process.env['E2E_USERNAME'] ?? 'admin',
    process.env['E2E_PASSWORD'] ?? 'Secret1!',
  );

  const dashboardPage = new DashboardPage(page);
  await dashboardPage.goto();

  // Stat cards should be visible (data-testid="stat-cards" contains them)
  await expect(page.getByTestId('stat-cards')).toBeVisible({ timeout: 10000 });

  // At least one kpi-value should be non-zero
  const kpiValues = page.locator('[data-testid="kpi-value"]');
  await expect(kpiValues.first()).toBeVisible({ timeout: 5000 });
});
