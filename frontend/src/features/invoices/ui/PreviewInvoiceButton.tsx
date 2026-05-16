import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, ExternalLink, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { getPreviewPdfBlobUrl } from '../api/generatedArtifactApi';
import { downloadInvoicePdf, downloadInvoiceDocx } from '../api/downloadInvoice';

interface PreviewInvoiceButtonProps {
  invoiceId: string;
  invoiceNumber: string;
}

export function PreviewInvoiceButton({ invoiceId, invoiceNumber }: PreviewInvoiceButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setBlobUrl(null);

    getPreviewPdfBlobUrl(invoiceId)
      .then((url) => {
        if (!cancelled) {
          setBlobUrl(url);
          blobUrlRef.current = url;
        } else {
          URL.revokeObjectURL(url);
        }
      })
      .catch(() => {
        if (!cancelled) {
          toast.error(t('invoices.toast.previewFailed'));
          setOpen(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, invoiceId, t]);

  // Revoke blob URL on unmount or when dialog closes
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  function handleClose(isOpen: boolean) {
    if (!isOpen && blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
      setBlobUrl(null);
    }
    setOpen(isOpen);
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} data-testid="btn-preview-invoice">
        <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
        {t('invoices.actions.preview')}
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col" data-testid="preview-dialog">
          <DialogHeader>
            <DialogTitle>
              {t('invoices.preview.title')} — {invoiceNumber}
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-end gap-3 mb-2 flex-wrap">
            {blobUrl && (
              <a
                href={blobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline"
                data-testid="link-preview-open-new-tab"
              >
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
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
              {t('invoices.actions.downloadPdf')}
            </button>
            <button
              type="button"
              onClick={() => void downloadInvoiceDocx(invoiceId, invoiceNumber)}
              className="inline-flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline"
              data-testid="btn-preview-download-docx"
            >
              <Download className="h-3 w-3" aria-hidden="true" />
              {t('invoices.actions.downloadDocx')}
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center">
            {loading && (
              <Loader2
                className="h-8 w-8 animate-spin text-[var(--color-muted-foreground)]"
                aria-hidden="true"
                data-testid="preview-loading"
              />
            )}
            {!loading && blobUrl && (
              <iframe
                src={blobUrl}
                title={`${t('invoices.preview.title')} ${invoiceNumber}`}
                className="w-full h-full border-0 rounded"
                sandbox="allow-same-origin"
                data-testid="preview-iframe"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
