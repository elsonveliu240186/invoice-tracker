import { useState, useEffect, useCallback } from 'react';
import type { CompanyProfile } from '../model/companyProfile';
import { getCompanyProfile } from './companyProfileApi';
import type { ApiError } from '@/shared/lib/http';

interface UseCompanyProfileResult {
  data: CompanyProfile | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => void;
}

export function useCompanyProfile(): UseCompanyProfileResult {
  const [data, setData] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getCompanyProfile()
      .then((profile) => {
        if (!cancelled) setData(profile);
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
  }, [revision]);

  const refetch = useCallback(() => setRevision((r) => r + 1), []);

  return { data, loading, error, refetch };
}
