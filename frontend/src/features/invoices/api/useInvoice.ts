import { useState, useEffect, useCallback } from 'react';
import type { Invoice } from '../model/types';
import { getInvoice } from './invoicesApi';
import type { ApiError } from '@/shared/lib/http';

interface UseInvoiceResult {
  data: Invoice | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => void;
}

export function useInvoice(id: string | null): UseInvoiceResult {
  const [data, setData] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    getInvoice(id)
      .then((invoice) => {
        if (!cancelled) setData(invoice);
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
  }, [id, revision]);

  const refetch = useCallback(() => setRevision((r) => r + 1), []);

  return { data, loading, error, refetch };
}
