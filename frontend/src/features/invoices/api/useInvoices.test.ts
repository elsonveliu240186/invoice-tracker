import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { resetMockInvoices } from '@/mocks/handlers';
import { useInvoices } from './useInvoices';

beforeEach(() => {
  resetMockInvoices();
});

describe('useInvoices', () => {
  it('starts in loading state', () => {
    const { result } = renderHook(() => useInvoices());
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('returns invoice page data after successful fetch', async () => {
    const { result } = renderHook(() => useInvoices());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).not.toBeNull();
    expect(result.current.data?.content).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });

  it('returns error on API failure', async () => {
    server.use(
      http.get('/api/v1/invoices', () =>
        HttpResponse.json({ status: 500, detail: 'Server error' }, { status: 500 }),
      ),
    );
    const { result } = renderHook(() => useInvoices());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBeNull();
    expect(result.current.error).not.toBeNull();
  });

  it('refetch triggers a new request', async () => {
    const { result } = renderHook(() => useInvoices());
    await waitFor(() => expect(result.current.loading).toBe(false));
    result.current.refetch();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).not.toBeNull();
  });
});
