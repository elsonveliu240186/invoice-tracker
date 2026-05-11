import { test, expect } from '@playwright/test';

// Skip these tests if the backend (or the dev server + backend) is not running.
// Set the BACKEND_AVAILABLE env var to "true" to run them in CI.
const backendAvailable = process.env['BACKEND_AVAILABLE'] === 'true';

test.describe('Client management E2E', () => {
  test.skip(!backendAvailable, 'Backend not available — set BACKEND_AVAILABLE=true to run');

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('user_creates_searches_edits_and_deletes_a_client', async ({ page }) => {
    // Navigate to clients page
    await page.getByTestId('link-clients').click();
    await expect(page).toHaveURL('/clients');
    await expect(page.getByRole('heading', { name: /clients/i })).toBeVisible();

    // Create a new client
    await page.getByTestId('btn-new-client').click();
    await expect(page.getByTestId('client-modal')).toBeVisible();

    const clientName = `E2E Client ${Date.now()}`;
    const clientEmail = `e2e${Date.now()}@example.com`;

    await page.getByTestId('input-name').fill(clientName);
    await page.getByTestId('input-email').fill(clientEmail);
    await page.getByTestId('input-phone').fill('+1 555 000 0000');
    await page.getByTestId('btn-submit').click();

    // Modal closes and toast appears
    await expect(page.getByTestId('client-modal')).not.toBeVisible();
    await expect(page.getByTestId('toast')).toBeVisible();
    await expect(page.getByText(clientName)).toBeVisible();

    // Search for the created client
    await page.getByTestId('search-input').fill(clientName);
    await expect(page.getByText(clientName)).toBeVisible();

    // Edit the client
    await page.getByLabel(`Edit ${clientName}`).click();
    await expect(page.getByTestId('client-modal')).toBeVisible();
    await expect(page.getByRole('heading', { name: /edit client/i })).toBeVisible();

    const updatedName = `${clientName} Updated`;
    await page.getByTestId('input-name').fill(updatedName);
    await page.getByTestId('btn-submit').click();

    await expect(page.getByTestId('client-modal')).not.toBeVisible();
    await expect(page.getByText(updatedName)).toBeVisible();

    // Delete the client
    await page.getByLabel(`Delete ${updatedName}`).click();
    await expect(page.getByTestId('confirm-delete-dialog')).toBeVisible();
    await page.getByTestId('btn-confirm-delete').click();

    await expect(page.getByTestId('confirm-delete-dialog')).not.toBeVisible();
    await expect(page.getByText(updatedName)).not.toBeVisible();
  });

  test('duplicate email shows field-level error', async ({ page }) => {
    await page.goto('/clients');

    // First client
    await page.getByTestId('btn-new-client').click();
    const email = `dup${Date.now()}@example.com`;
    await page.getByTestId('input-name').fill('First');
    await page.getByTestId('input-email').fill(email);
    await page.getByTestId('btn-submit').click();
    await expect(page.getByTestId('client-modal')).not.toBeVisible();

    // Second client with same email
    await page.getByTestId('btn-new-client').click();
    await page.getByTestId('input-name').fill('Second');
    await page.getByTestId('input-email').fill(email);
    await page.getByTestId('btn-submit').click();

    await expect(page.getByText(/email is already in use/i)).toBeVisible();
  });
});
