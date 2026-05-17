import { useState, useEffect, useCallback } from 'react';
import type { ExpenseSummary } from '../model/types';
import { getExpenseSummary } from './expensesApi';
import type { ApiError } from '@/shared/lib/http';

interface UseExpenseSummaryResult {
  data: ExpenseSummary | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => void;
}

export function useExpenseSummary(month?: string): UseExpenseSummaryResult {
  const [data, setData] = useState<ExpenseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getExpenseSummary(month)
      .then((s) => {
        if (!cancelled) setData(s);
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
  }, [month, revision]);

  const refetch = useCallback(() => setRevision((r) => r + 1), []);

  return { data, loading, error, refetch };
}
