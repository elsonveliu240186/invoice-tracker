import { describe, it, expect, beforeEach } from 'vitest';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import {
  listExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseSummary,
} from './expensesApi';
import { resetMockExpenses } from '@/mocks/handlers';

beforeEach(() => {
  resetMockExpenses();
});

describe('listExpenses', () => {
  it('returns paginated expenses', async () => {
    const result = await listExpenses(0);
    expect(result.content.length).toBeGreaterThanOrEqual(1);
    expect(result.page).toBe(0);
  });

  it('filters by category', async () => {
    const result = await listExpenses(0, 20, 'FOOD_DRINK');
    expect(result.content.every((e) => e.category === 'FOOD_DRINK')).toBe(true);
  });

  it('throws ApiError on 401', async () => {
    server.use(
      http.get('/api/v1/expenses', () => HttpResponse.json({ status: 401 }, { status: 401 })),
    );
    await expect(listExpenses()).rejects.toMatchObject({ status: 401 });
  });

  it('filters by dateFrom and dateTo', async () => {
    const result = await listExpenses(0, 20, undefined, '2026-01-01', '2026-12-31');
    expect(Array.isArray(result.content)).toBe(true);
  });
});

describe('getExpense', () => {
  it('returns a single expense', async () => {
    const result = await getExpense('exp-uuid-1');
    expect(result.id).toBe('exp-uuid-1');
  });

  it('throws 404 for unknown id', async () => {
    await expect(getExpense('nonexistent')).rejects.toMatchObject({ status: 404 });
  });

  it('throws ApiError on 401', async () => {
    server.use(
      http.get('/api/v1/expenses/:id', () => HttpResponse.json({ status: 401 }, { status: 401 })),
    );
    await expect(getExpense('exp-uuid-1')).rejects.toMatchObject({ status: 401 });
  });
});

describe('createExpense', () => {
  it('creates and returns new expense', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const result = await createExpense({
      amount: 25.0,
      category: 'TRANSPORT',
      expenseDate: today,
      description: 'Bus ticket',
    });
    expect(result.category).toBe('TRANSPORT');
    expect(result.amount).toBe(25);
  });

  it('throws 400 on invalid amount', async () => {
    server.use(
      http.post('/api/v1/expenses', () =>
        HttpResponse.json(
          { code: 'VALIDATION_ERROR', message: 'amount: must be greater than 0' },
          { status: 400 },
        ),
      ),
    );
    await expect(
      createExpense({ amount: 0, category: 'OTHER', expenseDate: '2026-05-01' }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('throws ApiError on 401', async () => {
    server.use(
      http.post('/api/v1/expenses', () => HttpResponse.json({ status: 401 }, { status: 401 })),
    );
    await expect(
      createExpense({ amount: 10, category: 'OTHER', expenseDate: '2026-05-01' }),
    ).rejects.toMatchObject({ status: 401 });
  });
});

describe('updateExpense', () => {
  it('updates and returns the expense', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const result = await updateExpense('exp-uuid-1', {
      amount: 99.99,
      category: 'HOUSING',
      expenseDate: today,
    });
    expect(result.amount).toBe(99.99);
    expect(result.category).toBe('HOUSING');
  });

  it('throws 404 for unknown id', async () => {
    await expect(
      updateExpense('nonexistent', { amount: 10, category: 'OTHER', expenseDate: '2026-05-01' }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('throws ApiError on 401', async () => {
    server.use(
      http.put('/api/v1/expenses/:id', () => HttpResponse.json({ status: 401 }, { status: 401 })),
    );
    await expect(
      updateExpense('exp-uuid-1', { amount: 10, category: 'OTHER', expenseDate: '2026-05-01' }),
    ).rejects.toMatchObject({ status: 401 });
  });
});

describe('deleteExpense', () => {
  it('deletes an expense and returns void', async () => {
    const result = await deleteExpense('exp-uuid-1');
    expect(result).toBeUndefined();
  });

  it('throws 404 for unknown id', async () => {
    await expect(deleteExpense('nonexistent')).rejects.toMatchObject({ status: 404 });
  });

  it('throws ApiError on 401', async () => {
    server.use(
      http.delete('/api/v1/expenses/:id', () =>
        HttpResponse.json({ status: 401 }, { status: 401 }),
      ),
    );
    await expect(deleteExpense('exp-uuid-1')).rejects.toMatchObject({ status: 401 });
  });
});

describe('getExpenseSummary', () => {
  it('returns summary for a given month', async () => {
    const result = await getExpenseSummary('2026-05');
    expect(result.month).toBe('2026-05');
    expect(typeof result.grandTotal).toBe('number');
    expect(Array.isArray(result.byCategory)).toBe(true);
  });

  it('returns summary without month param', async () => {
    const result = await getExpenseSummary();
    expect(result.month).toBeTruthy();
  });

  it('returns zero totals for a month with no expenses', async () => {
    const result = await getExpenseSummary('2000-01');
    expect(result.grandTotal).toBe(0);
    expect(result.totalCount).toBe(0);
    expect(result.byCategory).toHaveLength(0);
  });

  it('throws ApiError on 401', async () => {
    server.use(
      http.get('/api/v1/expenses/summary', () =>
        HttpResponse.json({ status: 401 }, { status: 401 }),
      ),
    );
    await expect(getExpenseSummary('2026-05')).rejects.toMatchObject({ status: 401 });
  });

  it('throws ApiError on 400 for malformed month', async () => {
    server.use(
      http.get('/api/v1/expenses/summary', () =>
        HttpResponse.json(
          { code: 'VALIDATION_ERROR', message: 'Invalid month format' },
          { status: 400 },
        ),
      ),
    );
    await expect(getExpenseSummary('bad-month')).rejects.toMatchObject({ status: 400 });
  });
});
