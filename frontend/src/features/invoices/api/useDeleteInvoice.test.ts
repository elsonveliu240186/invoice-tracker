import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { resetMockInvoices } from '@/mocks/handlers';
import { useDeleteInvoice } from './useDeleteInvoice';

beforeEach(() => {
  resetMockInvoices();
});

describe('useDeleteInvoice', () => {
  it('starts with idle state', () => {
    const { result } = renderHook(() => useDeleteInvoice());
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('204: resolves successfully', async () => {
    const { result } = renderHook(() => useDeleteInvoice());
    await act(async () => {
      await result.current.mutate('inv-uuid-1');
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('404: throws and sets error', async () => {
    server.use(
      http.delete('/api/v1/invoices/:id', () =>
        HttpResponse.json(
          {
            status: 404,
            detail: 'Invoice not found',
            code: 'INVOICE_NOT_FOUND',
          },
          { status: 404 },
        ),
      ),
    );

    const { result } = renderHook(() => useDeleteInvoice());
    await act(async () => {
      await expect(result.current.mutate('non-existent-id')).rejects.toThrow();
    });

    expect(result.current.error?.status).toBe(404);
    expect(result.current.error?.code).toBe('INVOICE_NOT_FOUND');
  });
});
