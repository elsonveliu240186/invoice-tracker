import type { Page, Locator } from '@playwright/test';

export class DashboardPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/');
    await this.page.waitForSelector('[data-testid="home-page"]');
  }

  kpiCard(testId: string): Locator {
    // KPI cards use data-testid="stat-card" or data-testid="kpi-card"
    return this.page.locator(`[data-testid="${testId}"]`).first();
  }

  revenueChart(): Locator {
    return this.page.getByTestId('revenue-chart');
  }

  expenseChart(): Locator {
    return this.page.getByTestId('expense-by-category-chart');
  }

  async setDateFilter(from: string, to: string): Promise<void> {
    await this.page.getByTestId('date-filter-from').fill(from);
    await this.page.getByTestId('date-filter-to').fill(to);
    await this.page.getByTestId('date-filter-apply').click();
  }
}
