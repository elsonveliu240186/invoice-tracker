import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { SendEmailResponse } from '../model/types';
import { sendInvoiceEmail } from './invoicesApi';
import type { ApiError } from '@/shared/lib/http';

interface UseSendInvoiceResult {
  loading: boolean;
  error: ApiError | null;
  data: SendEmailResponse | null;
  mutate: (id: string) => Promise<SendEmailResponse>;
}

export function useSendInvoice(onSuccess?: () => void): UseSendInvoiceResult {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [data, setData] = useState<SendEmailResponse | null>(null);

  const mutate = useCallback(
    async (id: string): Promise<SendEmailResponse> => {
      setLoading(true);
      setError(null);
      try {
        const result = await sendInvoiceEmail(id);
        setData(result);
        setLoading(false);
        toast.success(t('invoices.toast.sendSuccess'));
        onSuccess?.();
        return result;
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError);
        setLoading(false);
        if (apiError.status === 422 && apiError.code === 'INVOICE_HAS_NO_RECIPIENT') {
          toast.error(t('invoices.toast.noRecipient'));
        } else if (apiError.status === 502 && apiError.code === 'PDF_CONVERSION_FAILED') {
          toast.error(t('invoices.toast.pdfConversionFailed'));
        } else {
          toast.error(t('invoices.toast.sendFailed'));
        }
        throw apiError;
      }
    },
    [t, onSuccess],
  );

  return { loading, error, data, mutate };
}
