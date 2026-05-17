import { useState, useEffect } from 'react';
import type { DashboardExpenseStats } from '../model/types';
import { getDashboardExpenseStats } from './dashboardExpenseApi';
import type { ApiError } from '@/shared/lib/http';

interface UseDashboardExpenseStatsResult {
  data: DashboardExpenseStats | null;
  loading: boolean;
  error: ApiError | null;
}

export function useDashboardExpenseStats(
  from?: string | null,
  to?: string | null,
): UseDashboardExpenseStatsResult {
  const [data, setData] = useState<DashboardExpenseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getDashboardExpenseStats(from, to)
      .then((d) => {
        if (!cancelled) setData(d);
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
  }, [from, to]);

  return { data, loading, error };
}
