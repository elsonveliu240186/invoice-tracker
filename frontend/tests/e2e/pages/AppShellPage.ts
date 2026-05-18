import type { Page, Locator } from '@playwright/test';

export class AppShellPage {
  readonly sidebar: Locator;

  constructor(private readonly page: Page) {
    this.sidebar = this.page.locator('[aria-label="Sidebar navigation"]');
  }

  async logout(): Promise<void> {
    await this.page.getByTestId('user-menu-trigger').click();
    await this.page.getByTestId('sign-out-item').click();
  }

  navLink(label: string): Locator {
    return this.page.getByRole('link', { name: label });
  }

  async currentRoute(): Promise<string> {
    return new URL(this.page.url()).pathname;
  }
}
