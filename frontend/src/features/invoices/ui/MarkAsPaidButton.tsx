import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { useMarkInvoicePaid } from '../api/useMarkInvoicePaid';
import type { Invoice } from '../model/types';

interface MarkAsPaidButtonProps {
  invoiceId: string;
  status: Invoice['status'];
  onPaid?: () => void;
}

export function MarkAsPaidButton({ invoiceId, status, onPaid }: MarkAsPaidButtonProps) {
  const { t } = useTranslation();
  const { markPaid, loading } = useMarkInvoicePaid();

  if (status === 'PAID') {
    return null;
  }

  async function handleClick() {
    try {
      await markPaid(invoiceId);
      toast.success(t('invoices.toast.markPaidSuccess'));
      onPaid?.();
    } catch {
      toast.error(t('invoices.toast.markPaidFailed'));
    }
  }

  return (
    <Button onClick={() => void handleClick()} disabled={loading} data-testid="mark-as-paid-btn">
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <CheckCircle className="mr-2 h-4 w-4" aria-hidden="true" />
      )}
      {t('invoices.actions.markAsPaid')}
    </Button>
  );
}
