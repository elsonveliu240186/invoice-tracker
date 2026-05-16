import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import { useExpenseSummary } from './useExpenseSummary';
import { resetMockExpenses } from '@/mocks/handlers';

beforeEach(() => {
  resetMockExpenses();
});

describe('useExpenseSummary', () => {
  it('loads summary for a given month', async () => {
    const { result } = renderHook(() => useExpenseSummary('2026-05'));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).not.toBeNull();
    expect(result.current.data!.month).toBe('2026-05');
  });

  it('returns empty summary when no expenses in month', async () => {
    const { result } = renderHook(() => useExpenseSummary('2000-01'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data!.grandTotal).toBe(0);
    expect(result.current.data!.totalCount).toBe(0);
    expect(result.current.data!.byCategory).toHaveLength(0);
  });

  it('refetches when month changes', async () => {
    const { result, rerender } = renderHook(({ month }) => useExpenseSummary(month), {
      initialProps: { month: '2026-05' },
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    const firstMonth = result.current.data!.month;

    rerender({ month: '2026-04' });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data!.month).toBe('2026-04');
    expect(result.current.data!.month).not.toBe(firstMonth);
  });

  it('refetch triggers re-fetch', async () => {
    const { result } = renderHook(() => useExpenseSummary('2026-05'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.refetch());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).not.toBeNull();
  });

  it('sets error on API failure', async () => {
    server.use(
      http.get('/api/v1/expenses/summary', () =>
        HttpResponse.json({ status: 401 }, { status: 401 }),
      ),
    );
    const { result } = renderHook(() => useExpenseSummary('2026-05'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).not.toBeNull();
    expect(result.current.error!.status).toBe(401);
  });
});
