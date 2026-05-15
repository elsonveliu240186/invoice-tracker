import { describe, it, expect, beforeEach } from 'vitest';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import { markInvoicePaid } from './markInvoicePaid';
import { resetMockInvoices } from '@/mocks/handlers';

beforeEach(() => {
  resetMockInvoices();
});

describe('markInvoicePaid', () => {
  it('returns the invoice with status PAID on success', async () => {
    const invoice = await markInvoicePaid('inv-uuid-1');
    expect(invoice.id).toBe('inv-uuid-1');
    expect(invoice.status).toBe('PAID');
  });

  it('throws ApiError with status 404 when invoice is not found', async () => {
    await expect(markInvoicePaid('non-existent-id')).rejects.toMatchObject({
      status: 404,
    });
  });

  it('throws ApiError on server error', async () => {
    server.use(
      http.patch('/api/v1/invoices/:id/mark-paid', () =>
        HttpResponse.json({ status: 500, detail: 'Internal Server Error' }, { status: 500 }),
      ),
    );
    await expect(markInvoicePaid('inv-uuid-1')).rejects.toMatchObject({ status: 500 });
  });
});
