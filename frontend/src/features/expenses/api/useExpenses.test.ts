import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useExpenses } from './useExpenses';
import { resetMockExpenses } from '@/mocks/handlers';

beforeEach(() => {
  resetMockExpenses();
});

describe('useExpenses', () => {
  it('starts in loading state then returns data', async () => {
    const { result } = renderHook(() => useExpenses(0));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).not.toBeNull();
    expect(result.current.data!.content.length).toBeGreaterThanOrEqual(1);
    expect(result.current.error).toBeNull();
  });

  it('refetch increments revision and re-fetches', async () => {
    const { result } = renderHook(() => useExpenses(0));
    await waitFor(() => expect(result.current.loading).toBe(false));
    const initialTotal = result.current.data!.totalElements;

    act(() => result.current.refetch());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data!.totalElements).toBe(initialTotal);
  });

  it('fetches with category filter', async () => {
    const { result } = renderHook(() => useExpenses(0, 'FOOD_DRINK'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).not.toBeNull();
    const allMatch = result.current.data!.content.every((e) => e.category === 'FOOD_DRINK');
    expect(allMatch).toBe(true);
  });

  it('returns empty content for page with no data', async () => {
    const { result } = renderHook(() => useExpenses(999));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data!.content).toHaveLength(0);
  });
});
