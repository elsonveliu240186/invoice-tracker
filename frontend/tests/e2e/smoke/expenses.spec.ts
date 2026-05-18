/**
 * Smoke: create expense via UI form → verify row appears in expense list
 */
import { test, expect } from '../fixtures/test';
import { ExpensesPage } from '../pages/ExpensesPage';
import { LoginPage } from '../pages/LoginPage';

test('create expense via UI → row visible in list', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(
    process.env['E2E_USERNAME'] ?? 'admin@example.com',
    process.env['E2E_PASSWORD'] ?? 'Secret1!',
  );
  await expect(page).toHaveURL('/', { timeout: 30000 });

  const expensesPage = new ExpensesPage(page);
  await expensesPage.goto();

  const description = `Smoke Expense ${Date.now()}`;
  const today = new Date().toISOString().slice(0, 10);

  await expensesPage.openCreateDialog();
  await expensesPage.fillForm({
    amount: '75.00',
    category: 'OTHER',
    expenseDate: today,
    description,
  });
  await expensesPage.submitForm();

  // Row should appear in the table
  await expect(expensesPage.findRow(description)).toBeVisible({ timeout: 5000 });
});
