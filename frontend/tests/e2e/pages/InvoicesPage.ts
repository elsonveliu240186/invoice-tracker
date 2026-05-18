import type { Page, Locator } from '@playwright/test';

export class InvoicesPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/invoices');
    await this.page.waitForSelector('[data-testid="invoices-list-page"]');
  }

  async openCreateSheet(): Promise<void> {
    await this.page.getByTestId('btn-new-invoice').click();
    await this.page.waitForSelector('[data-testid="invoice-form-sheet"]');
  }

  async fillForm(data: {
    clientSearch?: string;
    number?: string;
    issueDate?: string;
    dueDate?: string;
    taxRate?: string;
  }): Promise<void> {
    if (data.clientSearch !== undefined) {
      await this.page.getByTestId('input-client-search').fill(data.clientSearch);
      // Wait for dropdown and select first option
      await this.page.waitForSelector('[data-testid="client-dropdown"]');
      await this.page.locator('[data-testid^="client-option-"]').first().click();
    }
    if (data.number !== undefined) {
      await this.page.getByTestId('input-number').fill(data.number);
    }
    if (data.issueDate !== undefined) {
      await this.page.getByTestId('input-issue-date').fill(data.issueDate);
    }
    if (data.dueDate !== undefined) {
      await this.page.getByTestId('input-due-date').fill(data.dueDate);
    }
    if (data.taxRate !== undefined) {
      await this.page.getByTestId('input-tax-rate').fill(data.taxRate);
    }
  }

  async addLine(description: string, qty: string, price: string): Promise<void> {
    await this.page.getByTestId('btn-add-line').click();
    const idx = (await this.page.locator('[data-testid^="line-item-"]').count()) - 1;
    await this.page.getByTestId(`input-line-description-${idx}`).fill(description);
    await this.page.getByTestId(`input-line-quantity-${idx}`).fill(qty);
    await this.page.getByTestId(`input-line-unit-price-${idx}`).fill(price);
  }

  async submitForm(): Promise<void> {
    await this.page.getByRole('button', { name: /save|create|submit/i }).click();
  }

  findRow(number: string): Locator {
    return this.page.locator('[data-testid="invoice-row"]').filter({ hasText: number });
  }
}
