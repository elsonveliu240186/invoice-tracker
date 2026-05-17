import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { usePdfBlobUrl } from '../api/usePdfBlobUrl';
import { downloadInvoicePdf } from '../api/downloadInvoice';

interface PreviewInvoiceButtonProps {
  invoiceId: string;
  invoiceNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PreviewInvoiceButton({
  invoiceId,
  invoiceNumber,
  open,
  onOpenChange,
}: PreviewInvoiceButtonProps) {
  const { t } = useTranslation();
  const { blobUrl, loading, error } = usePdfBlobUrl(invoiceId, open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col" data-testid="pdf-dialog">
        <DialogHeader>
          <DialogTitle>
            {t('invoices.detail.title')} — {invoiceNumber}
          </DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-end mb-2">
          <button
            type="button"
            onClick={() => void downloadInvoicePdf(invoiceId, invoiceNumber)}
            className="inline-flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline"
            data-testid="link-open-in-new-tab"
          >
            <Download className="h-3 w-3" aria-hidden="true" />
            {t('invoices.actions.download')}
          </button>
        </div>
        {loading && (
          <div className="flex flex-1 items-center justify-center text-sm text-[var(--color-muted-foreground)]">
            {t('common.loading')}
          </div>
        )}
        {error && (
          <div className="flex flex-1 items-center justify-center text-sm text-[var(--color-destructive)]">
            {t('invoices.toast.previewFailed')}
          </div>
        )}
        {blobUrl && (
          <iframe
            src={blobUrl}
            title={`Invoice ${invoiceNumber} PDF`}
            className="flex-1 w-full border-0 rounded"
            data-testid="pdf-iframe"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
