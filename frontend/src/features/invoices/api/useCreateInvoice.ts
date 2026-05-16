import { useState, useCallback } from 'react';
import { createInvoice } from './invoicesApi';
import type { Invoice, CreateInvoicePayload } from '../model/types';
import type { ApiError } from '@/shared/lib/http';

interface MutationState {
  loading: boolean;
  error: ApiError | null;
  data: Invoice | null;
}

export function useCreateInvoice() {
  const [state, setState] = useState<MutationState>({
    loading: false,
    error: null,
    data: null,
  });

  const mutate = useCallback(async (payload: CreateInvoicePayload): Promise<Invoice> => {
    setState({ loading: true, error: null, data: null });
    try {
      const invoice = await createInvoice(payload);
      setState({ loading: false, error: null, data: invoice });
      return invoice;
    } catch (err) {
      const apiError = err as ApiError;
      setState({ loading: false, error: apiError, data: null });
      throw apiError;
    }
  }, []);

  return { ...state, mutate };
}
