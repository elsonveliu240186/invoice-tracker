import type { Page, Locator } from '@playwright/test';

export class ClientsPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/clients');
    await this.page.waitForSelector('[data-testid="clients-page"]');
  }

  async openCreateSheet(): Promise<void> {
    await this.page.getByTestId('btn-new-client').click();
    await this.page.waitForSelector('[data-testid="client-form-sheet"]');
  }

  async fillForm(data: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
  }): Promise<void> {
    if (data.name !== undefined) {
      await this.page.getByTestId('input-name').fill(data.name);
    }
    if (data.email !== undefined) {
      await this.page.getByTestId('input-email').fill(data.email);
    }
    if (data.phone !== undefined) {
      await this.page.getByTestId('input-phone').fill(data.phone);
    }
    if (data.address !== undefined) {
      await this.page.getByTestId('input-address').fill(data.address);
    }
  }

  async submitForm(): Promise<void> {
    await this.page.getByTestId('btn-submit').click();
  }

  async searchFor(term: string): Promise<void> {
    await this.page.getByTestId('search-input').fill(term);
  }

  findRow(name: string): Locator {
    return this.page.locator('[data-testid="client-row"]').filter({ hasText: name });
  }

  async deleteRow(name: string): Promise<void> {
    const row = this.findRow(name);
    await row.getByTestId('btn-delete').click();
    await this.page.getByTestId('btn-confirm-delete').click();
  }
}
