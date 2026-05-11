import { test, expect } from '@playwright/test';

test.describe('smoke', () => {
  test('home page renders', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('home-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();
  });
});
