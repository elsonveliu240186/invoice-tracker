import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Loader2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { generateArtifact } from '../api/generatedArtifactApi';
import type { ArtifactFormat } from '../model/artifact';

interface GenerateInvoiceButtonProps {
  invoiceId: string;
  onGenerated?: () => void;
}

export function GenerateInvoiceButton({ invoiceId, onGenerated }: GenerateInvoiceButtonProps) {
  const { t } = useTranslation();
  const [pendingPdf, setPendingPdf] = useState(false);
  const [pendingDocx, setPendingDocx] = useState(false);

  const isPending = pendingPdf || pendingDocx;

  async function handleGenerate(format: ArtifactFormat) {
    if (isPending) return;
    if (format === 'PDF') setPendingPdf(true);
    else setPendingDocx(true);
    try {
      await generateArtifact(invoiceId, format, false);
      toast.success(t('invoices.toast.generateSuccess'));
      onGenerated?.();
    } catch {
      toast.error(t('invoices.toast.generateFailed'));
    } finally {
      if (format === 'PDF') setPendingPdf(false);
      else setPendingDocx(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isPending} data-testid="btn-generate-menu">
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
          )}
          {t('invoices.actions.generate')}
          <ChevronDown className="ml-2 h-4 w-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" data-testid="generate-menu-content">
        <DropdownMenuItem
          onClick={() => void handleGenerate('PDF')}
          disabled={isPending}
          data-testid="btn-generate-pdf"
        >
          {t('invoices.actions.generatePdf')}
          {pendingPdf && <Loader2 className="ml-2 h-3 w-3 animate-spin" aria-hidden="true" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => void handleGenerate('DOCX')}
          disabled={isPending}
          data-testid="btn-generate-docx"
        >
          {t('invoices.actions.generateDocx')}
          {pendingDocx && <Loader2 className="ml-2 h-3 w-3 animate-spin" aria-hidden="true" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
