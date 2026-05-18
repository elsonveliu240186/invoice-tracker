import type { Page, Locator } from '@playwright/test';

export class SettingsCompanyPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/settings/company');
    await this.page.waitForSelector('[data-testid="company-profile-settings-page"]');
  }

  async fillField(name: string, value: string): Promise<void> {
    await this.page.getByTestId(`input-${name}`).fill(value);
  }

  async save(): Promise<void> {
    await this.page.getByTestId('btn-save-company-profile').click();
  }

  async fieldValue(name: string): Promise<string> {
    return (await this.page.getByTestId(`input-${name}`).inputValue()) ?? '';
  }

  fieldError(name: string): Locator {
    return this.page.locator(`[id="company-${name}-error"], [data-testid="error-${name}"]`).first();
  }
}
