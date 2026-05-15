import { describe, it, expect, beforeEach } from 'vitest';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import { listInvoices, getInvoice, getInvoicePdfUrl, sendInvoiceEmail } from './invoicesApi';
import { resetMockInvoices } from '@/mocks/handlers';

beforeEach(() => {
  resetMockInvoices();
});

describe('listInvoices', () => {
  it('returns a page of invoices', async () => {
    const page = await listInvoices(0, 20);
    expect(page.content).toHaveLength(1);
    expect(page.totalElements).toBe(1);
  });

  it('throws ApiError on server error', async () => {
    server.use(
      http.get('/api/v1/invoices', () =>
        HttpResponse.json({ status: 500, detail: 'Server error' }, { status: 500 }),
      ),
    );
    await expect(listInvoices()).rejects.toMatchObject({ status: 500 });
  });
});

describe('getInvoice', () => {
  it('returns invoice data on 200', async () => {
    const invoice = await getInvoice('inv-uuid-1');
    expect(invoice.id).toBe('inv-uuid-1');
    expect(invoice.number).toBe('INV-2026-0001');
    expect(invoice.lines.length).toBeGreaterThan(0);
  });

  it('throws ApiError with status 404 for unknown id', async () => {
    await expect(getInvoice('non-existent-id')).rejects.toMatchObject({
      status: 404,
      code: 'INVOICE_NOT_FOUND',
    });
  });

  it('throws ApiError with status 401 when unauthorized', async () => {
    server.use(
      http.get('/api/v1/invoices/:id', () => {
        return HttpResponse.json(
          { status: 401, title: 'Unauthorized', code: 'UNAUTHORIZED' },
          { status: 401 },
        );
      }),
    );
    await expect(getInvoice('inv-uuid-1')).rejects.toMatchObject({ status: 401 });
  });
});

describe('getInvoicePdfUrl', () => {
  it('returns the correct URL path for an invoice id', () => {
    const url = getInvoicePdfUrl('inv-uuid-1');
    expect(url).toBe('/api/v1/invoices/inv-uuid-1/pdf');
  });

  it('returns a URL containing the given id', () => {
    const id = 'abc-123';
    expect(getInvoicePdfUrl(id)).toContain(id);
  });
});

describe('sendInvoiceEmail', () => {
  it('returns lastSentAt on success', async () => {
    const result = await sendInvoiceEmail('inv-uuid-1');
    expect(result.lastSentAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('throws ApiError with status 502 on delivery failure', async () => {
    server.use(
      http.post('/api/v1/invoices/:id/send-email', () => {
        return HttpResponse.json(
          {
            type: 'about:blank',
            title: 'Bad Gateway',
            status: 502,
            detail: 'SMTP delivery failed',
            code: 'EMAIL_DELIVERY_FAILED',
          },
          { status: 502 },
        );
      }),
    );
    await expect(sendInvoiceEmail('inv-uuid-1')).rejects.toMatchObject({
      status: 502,
      code: 'EMAIL_DELIVERY_FAILED',
    });
  });

  it('throws ApiError with status 404 for unknown invoice', async () => {
    await expect(sendInvoiceEmail('non-existent-id')).rejects.toMatchObject({
      status: 404,
      code: 'INVOICE_NOT_FOUND',
    });
  });

  it('throws ApiError with status 401 when unauthorized', async () => {
    server.use(
      http.post('/api/v1/invoices/:id/send-email', () => {
        return HttpResponse.json(
          { status: 401, title: 'Unauthorized', code: 'UNAUTHORIZED' },
          { status: 401 },
        );
      }),
    );
    await expect(sendInvoiceEmail('inv-uuid-1')).rejects.toMatchObject({ status: 401 });
  });
});
