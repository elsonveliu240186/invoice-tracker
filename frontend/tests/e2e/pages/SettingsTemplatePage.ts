import type { Page, Locator } from '@playwright/test';
import path from 'path';

export class SettingsTemplatePage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/settings/invoice-template');
    await this.page.waitForSelector('[data-testid="invoice-template-settings-page"]');
  }

  async uploadFile(filePath: string): Promise<void> {
    const input = this.page.getByTestId('template-file-input');
    await input.setInputFiles(path.resolve(filePath));
    await this.page.getByTestId('btn-upload-template').click();
  }

  metadataFilename(): Locator {
    return this.page.getByTestId('template-filename');
  }

  downloadCurrentButton(): Locator {
    return this.page.getByTestId('link-download-current');
  }
}
