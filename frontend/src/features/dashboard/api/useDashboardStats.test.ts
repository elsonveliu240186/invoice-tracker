import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { useDashboardStats } from './useDashboardStats';

const MOCK_STATS = {
  totalInvoices: 12,
  draftCount: 4,
  sentCount: 5,
  paidCount: 3,
  totalRevenue: 24500,
  paidRevenue: 8200,
  pendingRevenue: 16300,
  revenueByMonth: [
    { month: '2026-01', revenue: 3200 },
    { month: '2026-02', revenue: 4100 },
    { month: '2026-03', revenue: 5800 },
    { month: '2026-04', revenue: 4400 },
    { month: '2026-05', revenue: 7000 },
  ],
};

describe('useDashboardStats', () => {
  it('returns loading=true initially', () => {
    const { result } = renderHook(() => useDashboardStats());
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('returns data after successful fetch', async () => {
    const { result } = renderHook(() => useDashboardStats());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(MOCK_STATS);
    expect(result.current.error).toBeNull();
  });

  it('returns error on API failure', async () => {
    server.use(
      http.get('/api/v1/dashboard/stats', () =>
        HttpResponse.json({ status: 500, detail: 'Server error' }, { status: 500 }),
      ),
    );
    const { result } = renderHook(() => useDashboardStats());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBeNull();
    expect(result.current.error).not.toBeNull();
  });
});
