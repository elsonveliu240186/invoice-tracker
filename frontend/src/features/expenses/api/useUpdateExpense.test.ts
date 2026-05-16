import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import { useUpdateExpense } from './useUpdateExpense';
import { resetMockExpenses } from '@/mocks/handlers';

const today = new Date().toISOString().slice(0, 10);

beforeEach(() => {
  resetMockExpenses();
});

describe('useUpdateExpense', () => {
  it('starts idle', () => {
    const { result } = renderHook(() => useUpdateExpense());
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('updates and returns expense', async () => {
    const { result } = renderHook(() => useUpdateExpense());
    let expense: Awaited<ReturnType<typeof result.current.mutate>> | undefined;
    await act(async () => {
      expense = await result.current.mutate('exp-uuid-1', {
        amount: 77.77,
        category: 'HEALTH',
        expenseDate: today,
      });
    });
    expect(expense!.category).toBe('HEALTH');
    expect(expense!.amount).toBe(77.77);
    expect(result.current.error).toBeNull();
  });

  it('throws and sets error on 404', async () => {
    const { result } = renderHook(() => useUpdateExpense());
    let caught: unknown;
    await act(async () => {
      try {
        await result.current.mutate('nonexistent', {
          amount: 10,
          category: 'OTHER',
          expenseDate: today,
        });
      } catch (e) {
        caught = e;
      }
    });
    expect(caught).toBeDefined();
    expect(result.current.error!.status).toBe(404);
  });

  it('throws on 401', async () => {
    server.use(
      http.put('/api/v1/expenses/:id', () => HttpResponse.json({ status: 401 }, { status: 401 })),
    );
    const { result } = renderHook(() => useUpdateExpense());
    let caught: unknown;
    await act(async () => {
      try {
        await result.current.mutate('exp-uuid-1', {
          amount: 10,
          category: 'OTHER',
          expenseDate: today,
        });
      } catch (e) {
        caught = e;
      }
    });
    expect(caught).toBeDefined();
    expect(result.current.error!.status).toBe(401);
  });
});
