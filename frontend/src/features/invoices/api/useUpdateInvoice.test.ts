import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { resetMockInvoices } from '@/mocks/handlers';
import { useUpdateInvoice } from './useUpdateInvoice';
import type { UpdateInvoicePayload } from '../model/types';

const VALID_PAYLOAD: UpdateInvoicePayload = {
  clientId: 'uuid-1',
  issueDate: '2026-05-15',
  dueDate: '2026-06-15',
  taxRate: 0.21,
  lines: [{ description: 'Updated service', quantity: 2, unitPrice: 50 }],
};

beforeEach(() => {
  resetMockInvoices();
});

describe('useUpdateInvoice', () => {
  it('starts with idle state', () => {
    const { result } = renderHook(() => useUpdateInvoice());
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.data).toBeNull();
  });

  it('200: sets data on success', async () => {
    server.use(
      http.put('/api/v1/invoices/:id', () =>
        HttpResponse.json({
          id: 'inv-uuid-1',
          number: 'INV-2026-0001',
          clientId: 'uuid-1',
          clientEmail: null,
          issueDate: '2026-05-15',
          dueDate: '2026-06-15',
          taxRate: '0.21',
          lines: [
            {
              id: 'line-1',
              description: 'Updated service',
              quantity: 2,
              unitPrice: '50.00',
              lineTotal: '100.00',
            },
          ],
          subtotal: '100.00',
          total: '121.00',
          status: 'DRAFT',
          lastSentAt: null,
          createdAt: '2026-05-15T00:00:00Z',
          updatedAt: '2026-05-15T10:00:00Z',
        }),
      ),
    );

    const { result } = renderHook(() => useUpdateInvoice());
    await act(async () => {
      await result.current.mutate('inv-uuid-1', VALID_PAYLOAD);
    });

    expect(result.current.data?.id).toBe('inv-uuid-1');
    expect(result.current.error).toBeNull();
  });

  it('409: throws INVOICE_NOT_EDITABLE error', async () => {
    server.use(
      http.put('/api/v1/invoices/:id', () =>
        HttpResponse.json(
          {
            status: 409,
            detail: 'Invoice is not editable',
            code: 'INVOICE_NOT_EDITABLE',
          },
          { status: 409 },
        ),
      ),
    );

    const { result } = renderHook(() => useUpdateInvoice());
    await act(async () => {
      await expect(result.current.mutate('inv-uuid-1', VALID_PAYLOAD)).rejects.toThrow();
    });

    expect(result.current.error?.code).toBe('INVOICE_NOT_EDITABLE');
  });
});
