import { useState, useCallback } from 'react';
import { deleteInvoice } from './invoicesApi';
import type { ApiError } from '@/shared/lib/http';

interface MutationState {
  loading: boolean;
  error: ApiError | null;
}

export function useDeleteInvoice() {
  const [state, setState] = useState<MutationState>({
    loading: false,
    error: null,
  });

  const mutate = useCallback(async (id: string): Promise<void> => {
    setState({ loading: true, error: null });
    try {
      await deleteInvoice(id);
      setState({ loading: false, error: null });
    } catch (err) {
      const apiError = err as ApiError;
      setState({ loading: false, error: apiError });
      throw apiError;
    }
  }, []);

  return { ...state, mutate };
}
