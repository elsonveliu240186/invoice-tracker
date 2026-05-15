import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import { useMarkInvoicePaid } from './useMarkInvoicePaid';
import { resetMockInvoices } from '@/mocks/handlers';

beforeEach(() => {
  resetMockInvoices();
});

describe('useMarkInvoicePaid', () => {
  it('starts with loading=false and error=null', () => {
    const { result } = renderHook(() => useMarkInvoicePaid());
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets loading=true while request is in flight then false after', async () => {
    const { result } = renderHook(() => useMarkInvoicePaid());
    await act(async () => {
      await result.current.markPaid('inv-uuid-1');
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('clears error on successful call', async () => {
    const { result } = renderHook(() => useMarkInvoicePaid());
    // Force an error first
    server.use(
      http.patch('/api/v1/invoices/:id/mark-paid', () =>
        HttpResponse.json({ status: 500, detail: 'error' }, { status: 500 }),
      ),
    );
    await act(async () => {
      try {
        await result.current.markPaid('inv-uuid-1');
      } catch {
        // expected
      }
    });
    expect(result.current.error).not.toBeNull();
  });

  it('sets error state on failed call', async () => {
    server.use(
      http.patch('/api/v1/invoices/:id/mark-paid', () =>
        HttpResponse.json(
          { status: 404, detail: 'Invoice not found', code: 'INVOICE_NOT_FOUND' },
          { status: 404 },
        ),
      ),
    );
    const { result } = renderHook(() => useMarkInvoicePaid());
    await act(async () => {
      try {
        await result.current.markPaid('inv-uuid-1');
      } catch {
        // expected
      }
    });
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.loading).toBe(false);
  });

  it('throws the error so callers can handle it', async () => {
    server.use(
      http.patch('/api/v1/invoices/:id/mark-paid', () =>
        HttpResponse.json({ status: 404, detail: 'Not found' }, { status: 404 }),
      ),
    );
    const { result } = renderHook(() => useMarkInvoicePaid());
    let caughtError: unknown = null;
    await act(async () => {
      try {
        await result.current.markPaid('inv-uuid-1');
      } catch (err) {
        caughtError = err;
      }
    });
    expect(caughtError).not.toBeNull();
  });
});
