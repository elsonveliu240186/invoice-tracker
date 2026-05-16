import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { getInvoicePdfUrl } from '../api/invoicesApi';

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
  const pdfUrl = getInvoicePdfUrl(invoiceId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col" data-testid="pdf-dialog">
        <DialogHeader>
          <DialogTitle>
            {t('invoices.detail.title')} — {invoiceNumber}
          </DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-end mb-2">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline"
            data-testid="link-open-in-new-tab"
          >
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
            {t('invoices.actions.openInNewTab')}
          </a>
        </div>
        <iframe
          src={pdfUrl}
          title={`Invoice ${invoiceNumber} PDF`}
          className="flex-1 w-full border-0 rounded"
          sandbox="allow-same-origin"
          data-testid="pdf-iframe"
        />
      </DialogContent>
    </Dialog>
  );
}
