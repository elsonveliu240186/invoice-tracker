import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, FileText, FileDown, Loader2, ChevronDown, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { downloadInvoiceDocx, downloadInvoicePdf } from '../api/downloadInvoice';
import { downloadGeneratedArtifact, generateArtifact } from '../api/generatedArtifactApi';
import type { InvoiceArtifactsMetadata } from '../model/artifact';

interface DownloadInvoiceMenuProps {
  invoiceId: string;
  invoiceNumber: string;
  metadata?: InvoiceArtifactsMetadata | null;
  onRegenerated?: () => void;
}

export function DownloadInvoiceMenu({
  invoiceId,
  invoiceNumber,
  metadata,
  onRegenerated,
}: DownloadInvoiceMenuProps) {
  const { t } = useTranslation();
  const [pendingDocx, setPendingDocx] = useState(false);
  const [pendingPdf, setPendingPdf] = useState(false);
  const [pendingRegenPdf, setPendingRegenPdf] = useState(false);
  const [pendingRegenDocx, setPendingRegenDocx] = useState(false);

  const isPending = pendingDocx || pendingPdf || pendingRegenPdf || pendingRegenDocx;

  const hasSavedPdf = Boolean(metadata?.pdf);
  const hasSavedDocx = Boolean(metadata?.docx);

  async function handleDownloadDocx() {
    if (isPending) return;
    setPendingDocx(true);
    try {
      if (hasSavedDocx) {
        await downloadGeneratedArtifact(invoiceId, 'DOCX', `invoice-${invoiceNumber}.docx`);
      } else {
        await downloadInvoiceDocx(invoiceId, invoiceNumber);
      }
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
      if (hasSavedPdf) {
        await downloadGeneratedArtifact(invoiceId, 'PDF', `invoice-${invoiceNumber}.pdf`);
      } else {
        await downloadInvoicePdf(invoiceId, invoiceNumber);
      }
    } catch {
      toast.error(t('invoices.toast.downloadFailed'));
    } finally {
      setPendingPdf(false);
    }
  }

  async function handleRegeneratePdf() {
    if (isPending) return;
    setPendingRegenPdf(true);
    try {
      await generateArtifact(invoiceId, 'PDF', true);
      toast.success(t('invoices.toast.regenerated'));
      onRegenerated?.();
    } catch {
      toast.error(t('invoices.toast.generateFailed'));
    } finally {
      setPendingRegenPdf(false);
    }
  }

  async function handleRegenerateDocx() {
    if (isPending) return;
    setPendingRegenDocx(true);
    try {
      await generateArtifact(invoiceId, 'DOCX', true);
      toast.success(t('invoices.toast.regenerated'));
      onRegenerated?.();
    } catch {
      toast.error(t('invoices.toast.generateFailed'));
    } finally {
      setPendingRegenDocx(false);
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
          onClick={() => void handleDownloadDocx()}
          disabled={isPending}
          data-testid="btn-download-docx"
        >
          <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
          {hasSavedDocx
            ? t('invoices.actions.downloadSavedDocx')
            : t('invoices.actions.downloadDocx')}
          {pendingDocx && <Loader2 className="ml-2 h-3 w-3 animate-spin" aria-hidden="true" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => void handleDownloadPdf()}
          disabled={isPending}
          data-testid="btn-download-pdf"
        >
          <FileDown className="mr-2 h-4 w-4" aria-hidden="true" />
          {hasSavedPdf ? t('invoices.actions.downloadSavedPdf') : t('invoices.actions.downloadPdf')}
          {pendingPdf && <Loader2 className="ml-2 h-3 w-3 animate-spin" aria-hidden="true" />}
        </DropdownMenuItem>

        {(hasSavedPdf || hasSavedDocx) && (
          <>
            <DropdownMenuSeparator />
            {hasSavedPdf && (
              <DropdownMenuItem
                onClick={() => void handleRegeneratePdf()}
                disabled={isPending}
                data-testid="btn-regenerate-pdf"
              >
                <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                {t('invoices.actions.regeneratePdf')}
                {pendingRegenPdf && (
                  <Loader2 className="ml-2 h-3 w-3 animate-spin" aria-hidden="true" />
                )}
              </DropdownMenuItem>
            )}
            {hasSavedDocx && (
              <DropdownMenuItem
                onClick={() => void handleRegenerateDocx()}
                disabled={isPending}
                data-testid="btn-regenerate-docx"
              >
                <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                {t('invoices.actions.regenerateDocx')}
                {pendingRegenDocx && (
                  <Loader2 className="ml-2 h-3 w-3 animate-spin" aria-hidden="true" />
                )}
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
