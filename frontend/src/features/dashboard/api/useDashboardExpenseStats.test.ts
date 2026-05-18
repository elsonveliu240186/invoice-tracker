import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { useDashboardExpenseStats } from './useDashboardExpenseStats';

const MOCK_DATA = {
  from: '2025-12-01',
  to: '2026-05-17',
  grandTotal: '462.50',
  expenseByMonth: [
    { month: '2025-12', total: '0.00' },
    { month: '2026-01', total: '85.00' },
    { month: '2026-02', total: '120.00' },
    { month: '2026-03', total: '95.50' },
    { month: '2026-04', total: '120.00' },
    { month: '2026-05', total: '42.00' },
  ],
  expenseByCategory: [{ category: 'FOOD_DRINK', total: '162.50', count: 4 }],
};

describe('useDashboardExpenseStats', () => {
  it('loading_then_data', async () => {
    const { result } = renderHook(() => useDashboardExpenseStats());
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).not.toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('error_propagates', async () => {
    server.use(
      http.get('/api/v1/dashboard/expense-stats', () =>
        HttpResponse.json({ status: 500, detail: 'Server error' }, { status: 500 }),
      ),
    );
    const { result } = renderHook(() => useDashboardExpenseStats());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBeNull();
    expect(result.current.error).not.toBeNull();
  });

  it('refetches_on_dependency_change', async () => {
    const requestUrls: string[] = [];
    server.use(
      http.get('/api/v1/dashboard/expense-stats', ({ request }) => {
        requestUrls.push(request.url);
        return HttpResponse.json(MOCK_DATA);
      }),
    );

    const { result, rerender } = renderHook(
      ({ from, to }: { from?: string | null; to?: string | null }) =>
        useDashboardExpenseStats(from, to),
      { initialProps: { from: null as string | null, to: null as string | null } },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    const firstCount = requestUrls.length;

    rerender({ from: '2026-01-01', to: null });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(requestUrls.length).toBeGreaterThan(firstCount);
    expect(requestUrls[requestUrls.length - 1]).toContain('from=2026-01-01');
  });
});
