import type { Page, Locator } from '@playwright/test';

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/login');
    await this.page.waitForURL(/\/login/);
  }

  async login(email: string, password: string): Promise<void> {
    await this.page.locator('#login-email').fill(email);
    await this.page.locator('#login-password').fill(password);
    await this.page.getByRole('button', { name: 'Sign in', exact: true }).click();
  }

  async register(email: string, password: string, name: string): Promise<void> {
    await this.page.goto('/register');
    await this.page.locator('#reg-name').fill(name);
    await this.page.locator('#reg-email').fill(email);
    await this.page.locator('#reg-password').fill(password);
    // Fill confirm password with same value
    const confirmPwd = this.page.locator('#reg-confirm-password');
    if (await confirmPwd.isVisible()) {
      await confirmPwd.fill(password);
    }
    await this.page.getByRole('button', { name: /create account|sign up|register/i }).click();
  }

  errorToastLocator(): Locator {
    return this.page.locator('[data-sonner-toast]').first();
  }
}
