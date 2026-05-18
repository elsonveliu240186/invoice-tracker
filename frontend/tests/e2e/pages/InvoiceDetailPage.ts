import type { Page, Locator } from '@playwright/test';

export class InvoiceDetailPage {
  constructor(private readonly page: Page) {}

  async goto(id: string): Promise<void> {
    await this.page.goto(`/invoices/${id}`);
    await this.page.waitForSelector('[data-testid="invoice-detail-page"]');
  }

  statusBadge(): Locator {
    return this.page.getByTestId('status-badge').first();
  }

  async clickSend(): Promise<void> {
    await this.page.getByTestId('btn-send-invoice').click();
  }

  async confirmSend(): Promise<void> {
    await this.page.waitForSelector('[data-testid="send-confirm-dialog"]');
    await this.page.getByTestId('btn-confirm-send').click();
  }

  async clickMarkPaid(): Promise<void> {
    await this.page.getByTestId('mark-as-paid-btn').click();
  }

  downloadDocxButton(): Locator {
    return this.page.locator('[data-testid*="download"][data-testid*="docx"], [data-testid="btn-download-docx"]').first();
  }
}
