import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, FileText, FileDown, Loader2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { downloadInvoiceDocx, downloadInvoicePdf } from '../api/downloadInvoice';

interface DownloadInvoiceMenuProps {
  invoiceId: string;
  invoiceNumber: string;
}

export function DownloadInvoiceMenu({ invoiceId, invoiceNumber }: DownloadInvoiceMenuProps) {
  const { t } = useTranslation();
  const [pendingDocx, setPendingDocx] = useState(false);
  const [pendingPdf, setPendingPdf] = useState(false);

  const isPending = pendingDocx || pendingPdf;

  async function handleDownloadDocx() {
    if (isPending) return;
    setPendingDocx(true);
    try {
      await downloadInvoiceDocx(invoiceId, invoiceNumber);
    } catch {
      toast.error(t('invoices.toast.downloadFailed'));
    } finally {
      setPendingDocx(false);
    }
  }

  async function handleDownloadPdf() {
    if (isPending) return;
    setPendingPdf(true);
    try {
      await downloadInvoicePdf(invoiceId, invoiceNumber);
    } catch {
      toast.error(t('invoices.toast.downloadFailed'));
    } finally {
      setPendingPdf(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isPending} data-testid="btn-download-menu">
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Download className="mr-2 h-4 w-4" aria-hidden="true" />
          )}
          {t('invoices.actions.download')}
          <ChevronDown className="ml-2 h-4 w-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" data-testid="download-menu-content">
        <DropdownMenuItem
          onSelect={() => void handleDownloadDocx()}
          disabled={isPending}
          data-testid="btn-download-docx"
        >
          <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
          {t('invoices.actions.downloadDocx')}
          {pendingDocx && <Loader2 className="ml-2 h-3 w-3 animate-spin" aria-hidden="true" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => void handleDownloadPdf()}
          disabled={isPending}
          data-testid="btn-download-pdf"
        >
          <FileDown className="mr-2 h-4 w-4" aria-hidden="true" />
          {t('invoices.actions.downloadPdf')}
          {pendingPdf && <Loader2 className="ml-2 h-3 w-3 animate-spin" aria-hidden="true" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
