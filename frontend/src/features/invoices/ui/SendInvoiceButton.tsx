import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/ui/dialog';
import { useSendInvoice } from '../api/useSendInvoice';

interface SendInvoiceButtonProps {
  invoiceId: string;
  hasRecipient: boolean;
  onSent?: () => void;
}

export function SendInvoiceButton({ invoiceId, hasRecipient, onSent }: SendInvoiceButtonProps) {
  const { t } = useTranslation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { loading, mutate } = useSendInvoice(onSent);

  async function handleConfirm() {
    setConfirmOpen(false);
    try {
      await mutate(invoiceId);
    } catch {
      // error already handled in useSendInvoice (toast shown there)
    }
  }

  return (
    <>
      <Button
        onClick={() => setConfirmOpen(true)}
        disabled={!hasRecipient || loading}
        data-testid="btn-send-invoice"
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Send className="mr-2 h-4 w-4" aria-hidden="true" />
        )}
        {t('invoices.actions.sendToClient')}
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent data-testid="send-confirm-dialog">
          <DialogHeader>
            <DialogTitle>{t('invoices.confirm.send.title')}</DialogTitle>
            <DialogDescription>{t('invoices.confirm.send.description')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              data-testid="btn-confirm-cancel"
            >
              {t('common.cancel')}
            </Button>
            <Button onClick={() => void handleConfirm()} data-testid="btn-confirm-send">
              {t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
