import { useState, useEffect, useCallback } from 'react';
import type { ExpensePage, ExpenseCategory } from '../model/types';
import { listExpenses } from './expensesApi';
import type { ApiError } from '@/shared/lib/http';

interface UseExpensesResult {
  data: ExpensePage | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => void;
}

export function useExpenses(
  page = 0,
  category?: ExpenseCategory,
  dateFrom?: string,
  dateTo?: string,
): UseExpensesResult {
  const [data, setData] = useState<ExpensePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listExpenses(page, 20, category, dateFrom, dateTo)
      .then((p) => {
        if (!cancelled) setData(p);
      })
      .catch((err: ApiError) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, category, dateFrom, dateTo, revision]);

  const refetch = useCallback(() => setRevision((r) => r + 1), []);

  return { data, loading, error, refetch };
}
