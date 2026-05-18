import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { getDashboardExpenseStats } from './dashboardExpenseApi';

const MOCK_RESPONSE = {
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
  expenseByCategory: [
    { category: 'FOOD_DRINK', total: '162.50', count: 4 },
    { category: 'TRANSPORT', total: '120.00', count: 3 },
  ],
};

describe('getDashboardExpenseStats', () => {
  it('returns_stats_on_success', async () => {
    const data = await getDashboardExpenseStats();
    expect(data.expenseByMonth).toHaveLength(6);
    expect(data.grandTotal).toBe('462.50');
    expect(data.expenseByCategory.length).toBeGreaterThan(0);
  });

  it('passes from/to as query params', async () => {
    let capturedUrl = '';
    server.use(
      http.get('/api/v1/dashboard/expense-stats', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(MOCK_RESPONSE);
      }),
    );
    await getDashboardExpenseStats('2026-01-01', '2026-05-31');
    expect(capturedUrl).toContain('from=2026-01-01');
    expect(capturedUrl).toContain('to=2026-05-31');
  });

  it('rejects_on_500', async () => {
    server.use(
      http.get('/api/v1/dashboard/expense-stats', () =>
        HttpResponse.json({ status: 503, detail: 'Unavailable' }, { status: 503 }),
      ),
    );
    await expect(getDashboardExpenseStats()).rejects.toMatchObject({ status: 503 });
  });

  it('omits query params when from/to are null', async () => {
    let capturedUrl = '';
    server.use(
      http.get('/api/v1/dashboard/expense-stats', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(MOCK_RESPONSE);
      }),
    );
    await getDashboardExpenseStats(null, null);
    expect(capturedUrl).not.toContain('from=');
    expect(capturedUrl).not.toContain('to=');
  });
});
