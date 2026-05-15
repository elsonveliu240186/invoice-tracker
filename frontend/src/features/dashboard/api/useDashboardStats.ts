import { useState, useEffect } from 'react';
import type { DashboardStats } from '../model/types';
import { getDashboardStats } from './dashboardApi';
import type { ApiError } from '@/shared/lib/http';

interface UseDashboardStatsResult {
  data: DashboardStats | null;
  loading: boolean;
  error: ApiError | null;
}

export function useDashboardStats(): UseDashboardStatsResult {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getDashboardStats()
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
  }, []);

  return { data, loading, error };
}
