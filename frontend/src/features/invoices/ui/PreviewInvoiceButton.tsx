import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { usePdfBlobUrl } from '../api/usePdfBlobUrl';
import { downloadInvoicePdf, downloadInvoiceDocx } from '../api/downloadInvoice';

interface PreviewInvoiceButtonProps {
  invoiceId: string;
  invoiceNumber: string;
}

export function PreviewInvoiceButton({ invoiceId, invoiceNumber }: PreviewInvoiceButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { blobUrl, loading, error } = usePdfBlobUrl(invoiceId, open);

  useEffect(() => {
    if (error) {
      toast.error(t('invoices.toast.previewFailed'));
      setOpen(false);
    }
  }, [error, t]);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        data-testid="btn-preview-invoice"
      >
        <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
        {t('invoices.actions.viewPdf')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col" data-testid="preview-dialog">
          <DialogHeader>
            <DialogTitle>
              {t('invoices.detail.title')} — {invoiceNumber}
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-3 mb-2">
            {blobUrl && (
              <a
                href={blobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline"
                data-testid="link-preview-open-new-tab"
              >
                <Eye className="h-3 w-3" aria-hidden="true" />
                {t('invoices.actions.openInNewTab')}
              </a>
            )}
            <button
              type="button"
              onClick={() => void downloadInvoicePdf(invoiceId, invoiceNumber)}
              className="inline-flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline"
              data-testid="btn-preview-download-pdf"
            >
              <Download className="h-3 w-3" aria-hidden="true" />
              {t('invoices.actions.downloadPdf', 'Download PDF')}
            </button>
            <button
              type="button"
              onClick={() => void downloadInvoiceDocx(invoiceId, invoiceNumber)}
              className="inline-flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline"
              data-testid="btn-preview-download-docx"
            >
              <FileText className="h-3 w-3" aria-hidden="true" />
              {t('invoices.actions.downloadDocx', 'Download DOCX')}
            </button>
          </div>

          {loading && (
            <div
              className="flex flex-1 items-center justify-center text-sm text-[var(--color-muted-foreground)]"
              data-testid="preview-loading"
            >
              {t('common.loading')}
            </div>
          )}

          {blobUrl && (
            <iframe
              src={blobUrl}
              title={`Invoice ${invoiceNumber} PDF`}
              className="flex-1 w-full border-0 rounded"
              data-testid="preview-iframe"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
