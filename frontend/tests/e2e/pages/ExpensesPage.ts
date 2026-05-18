import type { Page, Locator } from '@playwright/test';

export class ExpensesPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/expenses');
    await this.page.waitForSelector('[data-testid="expenses-page"]');
  }

  async openCreateDialog(): Promise<void> {
    await this.page.getByTestId('btn-new-expense').click();
    await this.page.waitForSelector('[data-testid="expense-form-sheet"], [role="dialog"]');
  }

  async fillForm(data: {
    amount?: string;
    category?: string;
    expenseDate?: string;
    description?: string;
  }): Promise<void> {
    if (data.amount !== undefined) {
      await this.page.getByTestId('input-amount').fill(data.amount);
    }
    if (data.category !== undefined) {
      const categorySelect = this.page.getByTestId('select-category');
      const cat = data.category;
      await categorySelect.selectOption(cat).catch(async () => {
        await categorySelect.fill(cat);
      });
    }
    if (data.expenseDate !== undefined) {
      await this.page.getByTestId('input-expenseDate').fill(data.expenseDate);
    }
    if (data.description !== undefined) {
      await this.page.getByTestId('input-description').fill(data.description);
    }
  }

  async submitForm(): Promise<void> {
    await this.page.getByTestId('btn-submit').click();
  }

  findRow(description: string): Locator {
    return this.page.locator('[data-testid="expense-row"]').filter({ hasText: description });
  }
}
