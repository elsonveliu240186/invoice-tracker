import { useParams, Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { useInvoice } from '../api/useInvoice';
import { ViewPdfButton } from './ViewPdfButton';
import { DownloadInvoiceMenu } from './DownloadInvoiceMenu';
import { SendInvoiceButton } from './SendInvoiceButton';
import { InvoiceSentBadge } from './InvoiceSentBadge';
import { StatusBadge } from './StatusBadge';
import { MarkAsPaidButton } from './MarkAsPaidButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { data: invoice, loading, error, refetch } = useInvoice(id ?? null);

  if (loading) {
    return (
      <div data-testid="invoice-detail-loading">
        <Skeleton className="mb-4 h-8 w-48" />
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div data-testid="invoice-detail-not-found">
        <p className="mb-4 text-[var(--color-muted-foreground)]">{t('invoices.errors.notFound')}</p>
        <Link
          to="/invoices"
          className="text-[var(--color-primary)] hover:underline"
          data-testid="link-back-to-invoices"
        >
          {t('invoices.detail.backToList')}
        </Link>
      </div>
    );
  }

  const subtotal = parseFloat(invoice.subtotal);
  const total = parseFloat(invoice.total);
  const taxRate = parseFloat(invoice.taxRate);
  const taxAmount = total - subtotal;

  return (
    <div data-testid="invoice-detail-page">
      {/* Back link */}
      <div className="mb-4">
        <Link
          to="/invoices"
          className="inline-flex items-center gap-1 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          data-testid="link-back-to-invoices"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t('invoices.detail.backToList')}
        </Link>
      </div>

      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1
            className="text-2xl font-bold text-[var(--color-foreground)]"
            data-testid="invoice-number"
          >
            {t('invoices.detail.title')} {invoice.number}
          </h1>
          <StatusBadge status={invoice.status} />
        </div>
      </div>

      {/* Meta card */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle data-testid="invoice-meta-heading">{invoice.number}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex gap-8">
            <div>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                {t('invoices.detail.issueDate')}
              </p>
              <p data-testid="invoice-issue-date">{invoice.issueDate}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                {t('invoices.detail.dueDate')}
              </p>
              <p data-testid="invoice-due-date">{invoice.dueDate}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line items table */}
      <Card className="mb-4">
        <CardContent className="pt-4">
          <Table data-testid="invoice-lines-table">
            <TableHeader>
              <TableRow>
                <TableHead>{t('invoices.lines.description')}</TableHead>
                <TableHead className="text-right">{t('invoices.lines.quantity')}</TableHead>
                <TableHead className="text-right">{t('invoices.lines.unitPrice')}</TableHead>
                <TableHead className="text-right">{t('invoices.lines.lineTotal')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.lines.map((line) => (
                <TableRow key={line.id} data-testid="invoice-line-row">
                  <TableCell>{line.description}</TableCell>
                  <TableCell className="text-right">{line.quantity}</TableCell>
                  <TableCell className="text-right">${line.unitPrice}</TableCell>
                  <TableCell className="text-right">${line.lineTotal}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Totals */}
          <div className="mt-4 flex flex-col items-end gap-1 text-sm">
            <div className="flex gap-8">
              <span className="text-[var(--color-muted-foreground)]">
                {t('invoices.totals.subtotal')}
              </span>
              <span data-testid="invoice-subtotal">${subtotal.toFixed(2)}</span>
            </div>
            {taxRate > 0 && (
              <div className="flex gap-8">
                <span className="text-[var(--color-muted-foreground)]">
                  {t('invoices.totals.tax')} ({(taxRate * 100).toFixed(0)}%)
                </span>
                <span data-testid="invoice-tax">${taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex gap-8 font-bold border-t border-[var(--color-border)] pt-1">
              <span>{t('invoices.totals.total')}</span>
              <span data-testid="invoice-total">${total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action row */}
      <div className="flex items-center gap-3 flex-wrap" data-testid="invoice-action-row">
        <ViewPdfButton invoiceId={invoice.id} invoiceNumber={invoice.number} />
        <DownloadInvoiceMenu invoiceId={invoice.id} invoiceNumber={invoice.number} />
        <SendInvoiceButton
          invoiceId={invoice.id}
          hasRecipient={!!invoice.clientEmail}
          onSent={refetch}
        />
        <MarkAsPaidButton
          invoiceId={invoice.id}
          status={invoice.status}
          onPaid={() => void refetch()}
        />
        <InvoiceSentBadge lastSentAt={invoice.lastSentAt} />
      </div>
    </div>
  );
}
