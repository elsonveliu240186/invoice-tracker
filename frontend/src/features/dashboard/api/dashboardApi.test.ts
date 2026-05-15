import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { getDashboardStats } from './dashboardApi';

describe('getDashboardStats', () => {
  it('returns dashboard stats on success', async () => {
    const data = await getDashboardStats();
    expect(data.totalInvoices).toBe(12);
    expect(data.revenueByMonth).toHaveLength(5);
  });

  it('throws ApiError on server error', async () => {
    server.use(
      http.get('/api/v1/dashboard/stats', () =>
        HttpResponse.json({ status: 503, detail: 'Unavailable' }, { status: 503 }),
      ),
    );
    await expect(getDashboardStats()).rejects.toMatchObject({ status: 503 });
  });
});
