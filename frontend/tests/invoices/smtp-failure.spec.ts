/**
 * E2E: SMTP failure handling — send-email endpoint returns 502.
 *
 * This spec intercepts the POST /api/v1/invoices/{id}/send-email request at
 * the network layer (page.route) to simulate an SMTP outage returning 502,
 * then asserts:
 *   1. An error toast is shown to the user.
 *   2. After a page reload, the "Sent on …" badge is NOT visible, proving
 *      that lastSentAt was not persisted when delivery failed.
 *
 * No live backend required — all API calls are intercepted via page.route().
 * The invoice and client data are fully stubbed.
 */

import { test, expect, type Page } from '@playwright/test';

const INVOICE_ID = 'smtp-fail-invoice-001';
const INVOICE_NUMBER = 'INV-SMTP-FAIL-001';

// ── Auth seed ─────────────────────────────────────────────────────────────────

async function seedAuth(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'it.auth',
      JSON.stringify({
        state: {
          user: {
            email: 'qa@example.com',
            displayName: 'QA User',
            provider: 'password',
            basicAuthToken: btoa('qa@example.com:Secret1!'),
          },
        },
        version: 0,
      }),
    );
  });
}

// ── Invoice stub ──────────────────────────────────────────────────────────────

function invoiceFixture(lastSentAt: string | null = null) {
  return {
    id: INVOICE_ID,
    number: INVOICE_NUMBER,
    clientId: 'client-smtp-fail',
    clientEmail: `smtp-fail@mailhog.local`,
    issueDate: '2026-05-13',
    dueDate: '2026-06-12',
    taxRate: '0.00',
    lines: [
      {
        id: 'line-001',
        description: 'SMTP Test Item',
        quantity: 1,
        unitPrice: '10.00',
        lineTotal: '10.00',
      },
    ],
    subtotal: '10.00',
    total: '10.00',
    lastSentAt,
    createdAt: '2026-05-13T00:00:00Z',
    updatedAt: '2026-05-13T00:00:00Z',
  };
}

async function stubInvoice(page: Page, lastSentAt: string | null = null) {
  await page.route(`**/api/v1/invoices/${INVOICE_ID}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(invoiceFixture(lastSentAt)),
    }),
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('SMTP failure — send-email returns 502', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
  });

  test('shows error toast and does not set lastSentAt when send-email returns 502', async ({
    page,
  }) => {
    // Stub invoice — always returns lastSentAt=null (as if server never persisted it)
    await stubInvoice(page, null);

    // Intercept the send-email endpoint and return a 502 Bad Gateway to
    // simulate SMTP failure without needing to actually stop MailHog.
    await page.route(`**/api/v1/invoices/${INVOICE_ID}/send-email`, (route) => {
      void route.fulfill({
        status: 502,
        contentType: 'application/json',
        body: JSON.stringify({
          type: 'about:blank',
          title: 'Bad Gateway',
          status: 502,
          detail: 'Email delivery failed. Please try again later.',
          code: 'EMAIL_DELIVERY_FAILED',
        }),
      });
    });

    // Navigate to the invoice detail page
    await page.goto(`/invoices/${INVOICE_ID}`);

    // Wait for the Send button to be present and enabled (invoice has clientEmail)
    await expect(page.getByTestId('btn-send-invoice')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('btn-send-invoice')).not.toBeDisabled();

    // Click Send — confirm dialog appears
    await page.getByTestId('btn-send-invoice').click();
    await expect(page.getByTestId('send-confirm-dialog')).toBeVisible({ timeout: 5_000 });

    // Confirm the send
    await page.getByTestId('btn-confirm-send').click();

    // An error toast must appear
    await expect(page.getByText('Failed to send invoice')).toBeVisible({ timeout: 10_000 });

    // The "Sent on …" badge must NOT be visible because delivery failed
    await expect(page.getByTestId('invoice-sent-badge')).not.toBeVisible({ timeout: 5_000 });

    // Reload the page and verify lastSentAt is still null (badge absent after reload)
    await page.reload();
    await expect(page.getByTestId('invoice-detail-page')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('invoice-sent-badge')).not.toBeVisible({ timeout: 5_000 });
  });

  test('send button is re-enabled after 502 failure (user can retry)', async ({ page }) => {
    await stubInvoice(page, null);

    await page.route(`**/api/v1/invoices/${INVOICE_ID}/send-email`, (route) =>
      route.fulfill({
        status: 502,
        contentType: 'application/json',
        body: JSON.stringify({
          type: 'about:blank',
          title: 'Bad Gateway',
          status: 502,
          detail: 'Email delivery failed.',
          code: 'EMAIL_DELIVERY_FAILED',
        }),
      }),
    );

    await page.goto(`/invoices/${INVOICE_ID}`);
    await expect(page.getByTestId('invoice-detail-page')).toBeVisible({ timeout: 10_000 });

    await page.getByTestId('btn-send-invoice').click();
    await expect(page.getByTestId('send-confirm-dialog')).toBeVisible();
    await page.getByTestId('btn-confirm-send').click();

    // Wait for error toast
    await expect(page.getByText('Failed to send invoice')).toBeVisible({ timeout: 10_000 });

    // Button must be re-enabled so user can retry
    await expect(page.getByTestId('btn-send-invoice')).not.toBeDisabled({ timeout: 5_000 });
  });
});
