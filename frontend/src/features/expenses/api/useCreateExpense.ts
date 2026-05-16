import { useState, useCallback } from 'react';
import { createExpense } from './expensesApi';
import type { Expense, CreateExpensePayload } from '../model/types';
import type { ApiError } from '@/shared/lib/http';

interface MutationState {
  loading: boolean;
  error: ApiError | null;
  data: Expense | null;
}

export function useCreateExpense() {
  const [state, setState] = useState<MutationState>({
    loading: false,
    error: null,
    data: null,
  });

  const mutate = useCallback(async (payload: CreateExpensePayload): Promise<Expense> => {
    setState({ loading: true, error: null, data: null });
    try {
      const expense = await createExpense(payload);
      setState({ loading: false, error: null, data: expense });
      return expense;
    } catch (err) {
      const apiError = err as ApiError;
      setState({ loading: false, error: apiError, data: null });
      throw apiError;
    }
  }, []);

  return { ...state, mutate };
}
