import { useState, useCallback } from 'react';
import { markInvoicePaid } from './markInvoicePaid';

interface UseMarkInvoicePaidResult {
  markPaid: (id: string) => Promise<void>;
  loading: boolean;
  error: Error | null;
}

export function useMarkInvoicePaid(): UseMarkInvoicePaidResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const markPaid = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await markInvoicePaid(id);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { markPaid, loading, error };
}
