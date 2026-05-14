import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import { useInvoice } from './useInvoice';
import { resetMockInvoices } from '@/mocks/handlers';

beforeEach(() => {
  resetMockInvoices();
});

describe('useInvoice', () => {
  it('starts with loading=false and no data when id is null', () => {
    const { result } = renderHook(() => useInvoice(null));
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('transitions to loading=true then resolves with data', async () => {
    const { result } = renderHook(() => useInvoice('inv-uuid-1'));
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).not.toBeNull();
    expect(result.current.data?.id).toBe('inv-uuid-1');
    expect(result.current.error).toBeNull();
  });

  it('sets error on 404', async () => {
    const { result } = renderHook(() => useInvoice('non-existent-id'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.status).toBe(404);
    expect(result.current.data).toBeNull();
  });

  it('refetch triggers a new request', async () => {
    const { result } = renderHook(() => useInvoice('inv-uuid-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data?.id).toBe('inv-uuid-1');

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data?.id).toBe('inv-uuid-1');
  });

  it('sets error state when server returns 500', async () => {
    server.use(
      http.get('/api/v1/invoices/:id', () => {
        return HttpResponse.json({ status: 500, title: 'Internal Server Error' }, { status: 500 });
      }),
    );
    const { result } = renderHook(() => useInvoice('inv-uuid-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.status).toBe(500);
  });
});
