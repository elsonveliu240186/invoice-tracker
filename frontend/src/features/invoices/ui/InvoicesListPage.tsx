import { useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { FileText } from 'lucide-react';
import { useInvoices } from '../api/useInvoices';
import { StatusBadge } from './StatusBadge';
import { PageHeader } from '@/shared/components/PageHeader';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

export function InvoicesListPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const { data, loading, error } = useInvoices(page);

  return (
    <div data-testid="invoices-list-page">
      <PageHeader title={t('nav.invoices')} />

      {loading && (
        <div className="space-y-2" data-testid="invoices-loading">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {error && (
        <p role="alert" className="py-4 text-center text-[var(--color-destructive)]">
          {error.message}
        </p>
      )}

      {!loading && !error && data && data.content.length === 0 && (
        <div
          className="flex flex-col items-center gap-3 py-16 text-[var(--color-muted-foreground)]"
          data-testid="invoices-empty"
        >
          <FileText className="h-10 w-10 opacity-40" aria-hidden="true" />
          <p className="text-sm">{t('invoices.list.empty')}</p>
        </div>
      )}

      {!loading && !error && data && data.content.length > 0 && (
        <>
          <Table data-testid="invoices-table">
            <TableHeader>
              <TableRow>
                <TableHead>{t('invoices.fields.number')}</TableHead>
                <TableHead>{t('invoices.fields.issueDate')}</TableHead>
                <TableHead>{t('invoices.fields.dueDate')}</TableHead>
                <TableHead>{t('invoices.fields.status', 'Status')}</TableHead>
                <TableHead className="text-right">{t('invoices.fields.total')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.content.map((invoice) => (
                <TableRow key={invoice.id} data-testid="invoice-row">
                  <TableCell>
                    <Link
                      to={`/invoices/${invoice.id}`}
                      className="font-medium text-[var(--color-primary)] hover:underline"
                    >
                      {invoice.number}
                    </Link>
                  </TableCell>
                  <TableCell>{invoice.issueDate}</TableCell>
                  <TableCell>{invoice.dueDate}</TableCell>
                  <TableCell>
                    <StatusBadge status={invoice.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    ${parseFloat(invoice.total).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {data.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-[var(--color-muted-foreground)]">
              <span>{t('common.page', { page: page + 1, total: data.totalPages })}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="rounded border border-[var(--color-border)] px-3 py-1 disabled:opacity-40"
                  data-testid="btn-prev-page"
                >
                  {t('common.previous')}
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))}
                  disabled={page >= data.totalPages - 1}
                  className="rounded border border-[var(--color-border)] px-3 py-1 disabled:opacity-40"
                  data-testid="btn-next-page"
                >
                  {t('common.next')}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
