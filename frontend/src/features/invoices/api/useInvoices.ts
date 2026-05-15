import { useState, useEffect, useCallback } from 'react';
import type { InvoicePage } from '../model/types';
import { listInvoices } from './invoicesApi';
import type { ApiError } from '@/shared/lib/http';

interface UseInvoicesResult {
  data: InvoicePage | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => void;
}

export function useInvoices(page = 0, size = 20): UseInvoicesResult {
  const [data, setData] = useState<InvoicePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listInvoices(page, size)
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
  }, [page, size, revision]);

  const refetch = useCallback(() => setRevision((r) => r + 1), []);

  return { data, loading, error, refetch };
}
