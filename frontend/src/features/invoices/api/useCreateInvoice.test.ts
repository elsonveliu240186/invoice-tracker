import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { resetMockInvoices } from '@/mocks/handlers';
import { useCreateInvoice } from './useCreateInvoice';
import type { CreateInvoicePayload } from '../model/types';

const VALID_PAYLOAD: CreateInvoicePayload = {
  clientId: 'uuid-1',
  issueDate: '2026-05-15',
  dueDate: '2026-06-15',
  taxRate: 0.21,
  lines: [{ description: 'Consulting', quantity: 1, unitPrice: 100 }],
};

beforeEach(() => {
  resetMockInvoices();
});

describe('useCreateInvoice', () => {
  it('starts with idle state', () => {
    const { result } = renderHook(() => useCreateInvoice());
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.data).toBeNull();
  });

  it('201: sets data on success', async () => {
    server.use(
      http.post('/api/v1/invoices', () =>
        HttpResponse.json(
          {
            id: 'new-inv-id',
            number: 'INV-2026-0002',
            clientId: 'uuid-1',
            clientEmail: null,
            issueDate: '2026-05-15',
            dueDate: '2026-06-15',
            taxRate: '0.21',
            lines: [
              {
                id: 'line-1',
                description: 'Consulting',
                quantity: 1,
                unitPrice: '100.00',
                lineTotal: '100.00',
              },
            ],
            subtotal: '100.00',
            total: '121.00',
            status: 'DRAFT',
            lastSentAt: null,
            createdAt: '2026-05-15T00:00:00Z',
            updatedAt: '2026-05-15T00:00:00Z',
          },
          { status: 201 },
        ),
      ),
    );

    const { result } = renderHook(() => useCreateInvoice());
    await act(async () => {
      await result.current.mutate(VALID_PAYLOAD);
    });

    expect(result.current.data?.number).toBe('INV-2026-0002');
    expect(result.current.error).toBeNull();
  });

  it('400: throws and sets error on validation failure', async () => {
    server.use(
      http.post('/api/v1/invoices', () =>
        HttpResponse.json(
          { status: 400, detail: 'Validation failed', code: 'VALIDATION_ERROR' },
          { status: 400 },
        ),
      ),
    );

    const { result } = renderHook(() => useCreateInvoice());
    await act(async () => {
      await expect(result.current.mutate(VALID_PAYLOAD)).rejects.toThrow();
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.status).toBe(400);
  });

  it('409: throws INVOICE_NUMBER_TAKEN error', async () => {
    server.use(
      http.post('/api/v1/invoices', () =>
        HttpResponse.json(
          {
            status: 409,
            detail: 'Invoice number already taken',
            code: 'INVOICE_NUMBER_TAKEN',
          },
          { status: 409 },
        ),
      ),
    );

    const { result } = renderHook(() => useCreateInvoice());
    await act(async () => {
      await expect(result.current.mutate(VALID_PAYLOAD)).rejects.toThrow();
    });

    expect(result.current.error?.code).toBe('INVOICE_NUMBER_TAKEN');
  });
});
