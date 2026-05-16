import { useState, useCallback } from 'react';
import { updateInvoice } from './invoicesApi';
import type { Invoice, UpdateInvoicePayload } from '../model/types';
import type { ApiError } from '@/shared/lib/http';

interface MutationState {
  loading: boolean;
  error: ApiError | null;
  data: Invoice | null;
}

export function useUpdateInvoice() {
  const [state, setState] = useState<MutationState>({
    loading: false,
    error: null,
    data: null,
  });

  const mutate = useCallback(
    async (id: string, payload: UpdateInvoicePayload): Promise<Invoice> => {
      setState({ loading: true, error: null, data: null });
      try {
        const invoice = await updateInvoice(id, payload);
        setState({ loading: false, error: null, data: invoice });
        return invoice;
      } catch (err) {
        const apiError = err as ApiError;
        setState({ loading: false, error: apiError, data: null });
        throw apiError;
      }
    },
    [],
  );

  return { ...state, mutate };
}
