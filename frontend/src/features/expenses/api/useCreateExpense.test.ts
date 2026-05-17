import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import { useCreateExpense } from './useCreateExpense';
import { resetMockExpenses } from '@/mocks/handlers';

const today = new Date().toISOString().slice(0, 10);

beforeEach(() => {
  resetMockExpenses();
});

describe('useCreateExpense', () => {
  it('starts idle', () => {
    const { result } = renderHook(() => useCreateExpense());
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.data).toBeNull();
  });

  it('sets loading during mutate and resolves with data', async () => {
    const { result } = renderHook(() => useCreateExpense());
    let expense: Awaited<ReturnType<typeof result.current.mutate>> | undefined;
    await act(async () => {
      expense = await result.current.mutate({
        amount: 15,
        category: 'TRANSPORT',
        expenseDate: today,
        description: 'Bus',
      });
    });
    expect(expense).toBeDefined();
    expect(expense!.category).toBe('TRANSPORT');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets error and rethrows on API failure', async () => {
    server.use(
      http.post('/api/v1/expenses', () =>
        HttpResponse.json({ code: 'VALIDATION_ERROR' }, { status: 400 }),
      ),
    );
    const { result } = renderHook(() => useCreateExpense());
    let caught: unknown;
    await act(async () => {
      try {
        await result.current.mutate({ amount: 0, category: 'OTHER', expenseDate: today });
      } catch (e) {
        caught = e;
      }
    });
    expect(caught).toBeDefined();
    expect(result.current.error).not.toBeNull();
    expect(result.current.error!.status).toBe(400);
  });
});
