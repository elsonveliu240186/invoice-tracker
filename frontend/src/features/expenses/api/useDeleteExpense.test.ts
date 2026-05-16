import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import { useDeleteExpense } from './useDeleteExpense';
import { resetMockExpenses } from '@/mocks/handlers';

beforeEach(() => {
  resetMockExpenses();
});

describe('useDeleteExpense', () => {
  it('starts idle', () => {
    const { result } = renderHook(() => useDeleteExpense());
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('deletes successfully', async () => {
    const { result } = renderHook(() => useDeleteExpense());
    await act(async () => {
      await result.current.mutate('exp-uuid-1');
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('throws and sets error on 404', async () => {
    const { result } = renderHook(() => useDeleteExpense());
    let caught: unknown;
    await act(async () => {
      try {
        await result.current.mutate('nonexistent');
      } catch (e) {
        caught = e;
      }
    });
    expect(caught).toBeDefined();
    expect(result.current.error!.status).toBe(404);
  });

  it('throws on 401', async () => {
    server.use(
      http.delete('/api/v1/expenses/:id', () =>
        HttpResponse.json({ status: 401 }, { status: 401 }),
      ),
    );
    const { result } = renderHook(() => useDeleteExpense());
    let caught: unknown;
    await act(async () => {
      try {
        await result.current.mutate('exp-uuid-1');
      } catch (e) {
        caught = e;
      }
    });
    expect(caught).toBeDefined();
    expect(result.current.error!.status).toBe(401);
  });
});
