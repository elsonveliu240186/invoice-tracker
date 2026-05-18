import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { usePdfBlobUrl } from '../api/usePdfBlobUrl';

interface ViewPdfButtonProps {
  invoiceId: string;
  invoiceNumber: string;
}

export function ViewPdfButton({ invoiceId, invoiceNumber }: ViewPdfButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { blobUrl, loading, error } = usePdfBlobUrl(`/api/v1/invoices/${invoiceId}/pdf`, open);

  useEffect(() => {
    if (error) {
      toast.error(t('invoices.toast.previewFailed'));
      const tid = window.setTimeout(() => setOpen(false), 0);
      return () => window.clearTimeout(tid);
    }
  }, [error, t]);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} data-testid="btn-view-pdf">
        <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
        {t('invoices.actions.viewPdf')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col" data-testid="pdf-dialog">
          <DialogHeader>
            <DialogTitle>
              {t('invoices.detail.title')} — {invoiceNumber}
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-end mb-2">
            {blobUrl && (
              <a
                href={blobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline"
                data-testid="link-open-in-new-tab"
              >
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
                {t('invoices.actions.openInNewTab')}
              </a>
            )}
          </div>

          {loading && (
            <div
              className="flex flex-1 items-center justify-center text-sm text-[var(--color-muted-foreground)]"
              data-testid="pdf-loading"
            >
              {t('common.loading')}
            </div>
          )}

          {blobUrl && (
            <iframe
              src={blobUrl}
              title={`Invoice ${invoiceNumber} PDF`}
              className="flex-1 w-full border-0 rounded"
              sandbox="allow-same-origin"
              data-testid="pdf-iframe"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
