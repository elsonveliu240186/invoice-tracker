import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { FileText, Plus, Eye, Pencil, Trash2, X, Send, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useInvoices } from '../api/useInvoices';
import { useCreateInvoice } from '../api/useCreateInvoice';
import { useUpdateInvoice } from '../api/useUpdateInvoice';
import { useDeleteInvoice } from '../api/useDeleteInvoice';
import { useSendInvoice } from '../api/useSendInvoice';
import { useMarkInvoicePaid } from '../api/useMarkInvoicePaid';
import { StatusBadge } from './StatusBadge';
import { InvoiceFormSheet } from './InvoiceFormSheet';
import { PageHeader } from '@/shared/components/PageHeader';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/shared/ui/dropdown-menu';
import type { InvoiceFormValues } from '../model/schema';
import type { Invoice } from '../model/types';

type StatusFilter = 'ALL' | Invoice['status'];

function ConfirmDeleteDialog({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onCancel} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg bg-[var(--color-background)] p-6 shadow-xl"
        data-testid="confirm-delete-dialog"
      >
        <h2 className="mb-2 text-lg font-semibold">{t('invoices.detail.delete')}</h2>
        <p className="mb-4 text-sm text-[var(--color-muted-foreground)]">
          {t(
            'invoices.deleteConfirm',
            'Are you sure you want to delete this invoice? This action cannot be undone.',
          )}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel} data-testid="btn-cancel-delete">
            {t('common.cancel')}
          </Button>
          <Button variant="destructive" onClick={onConfirm} data-testid="btn-confirm-delete">
            {t('common.delete')}
          </Button>
        </div>
      </div>
    </>
  );
}

export function InvoicesListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  const { data, loading, error, refetch } = useInvoices(page);
  const { mutate: createMutate } = useCreateInvoice();
  const { mutate: updateMutate } = useUpdateInvoice();
  const { mutate: deleteMutate } = useDeleteInvoice();
  const { mutate: sendMutate } = useSendInvoice(refetch);
  const { markPaid } = useMarkInvoicePaid();
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | null>(null);

  function openCreate() {
    setEditingInvoice(null);
    setSheetOpen(true);
  }

  function openEdit(invoice: Invoice) {
    setEditingInvoice(invoice);
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
    setEditingInvoice(null);
  }

  function clearSearch() {
    setSearch('');
    setPage(0);
  }

  const handleSubmit = useCallback(
    async (formData: InvoiceFormValues) => {
      const payload = {
        clientId: formData.clientId,
        number: formData.number,
        issueDate: formData.issueDate,
        dueDate: formData.dueDate,
        taxRate: formData.taxRate,
        lines: formData.lines.map((l) => ({
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
        })),
      };
      if (editingInvoice) {
        await updateMutate(editingInvoice.id, payload);
        toast.success(t('invoices.toast.updated'));
      } else {
        await createMutate(payload);
        toast.success(t('invoices.toast.created'));
      }
      closeSheet();
      refetch();
    },
    [editingInvoice, createMutate, updateMutate, t, refetch],
  );

  async function handleSend(invoice: Invoice) {
    setSendingId(invoice.id);
    try {
      await sendMutate(invoice.id);
    } catch {
      // toast already shown in useSendInvoice
    } finally {
      setSendingId(null);
    }
  }

  async function handleMarkPaid(invoice: Invoice) {
    setPayingId(invoice.id);
    try {
      await markPaid(invoice.id);
      toast.success(t('invoices.toast.markPaidSuccess'));
      refetch();
    } catch {
      toast.error(t('invoices.toast.markPaidFailed'));
    } finally {
      setPayingId(null);
    }
  }

  async function handleConfirmDelete() {
    if (!deletingInvoice) return;
    try {
      await deleteMutate(deletingInvoice.id);
      toast.success(t('invoices.toast.deleted'));
      setDeletingInvoice(null);
      refetch();
    } catch {
      toast.error(t('invoices.toast.deleteFailed', 'Failed to delete invoice'));
      setDeletingInvoice(null);
    }
  }

  const filteredInvoices =
    data?.content.filter((inv) => {
      const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
      const matchesSearch = !search || inv.number.toLowerCase().includes(search.toLowerCase());
      return matchesStatus && matchesSearch;
    }) ?? [];

  const statusFilterLabel =
    statusFilter === 'ALL'
      ? t('invoices.status.all', 'All')
      : t(`invoices.status.${statusFilter.toLowerCase()}`, statusFilter);

  return (
    <div data-testid="invoices-list-page">
      <PageHeader
        title={t('nav.invoices')}
        actions={
          <Button onClick={openCreate} data-testid="btn-new-invoice">
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            {t('invoices.form.title.create')}
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex items-center sm:max-w-xs">
          <Input
            type="search"
            placeholder={t('invoices.searchPlaceholder', 'Search by invoice #…')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="pr-8 sm:max-w-xs"
            data-testid="search-input"
          />
          {search.length > 0 && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2 flex items-center justify-center rounded p-0.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              data-testid="btn-clear-search"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" data-testid="status-filter-trigger">
              {t('invoices.statusFilter', 'Status')}: {statusFilterLabel}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent data-testid="status-filter-menu">
            {(['ALL', 'DRAFT', 'SENT', 'PAID'] as const).map((s) => (
              <DropdownMenuItem
                key={s}
                onClick={() => setStatusFilter(s)}
                data-testid={`filter-${s.toLowerCase()}`}
              >
                {s === 'ALL'
                  ? t('invoices.status.all', 'All')
                  : t(`invoices.status.${s.toLowerCase()}`, s)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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

      {!loading && !error && data && filteredInvoices.length === 0 && (
        <div
          className="flex flex-col items-center gap-3 py-16 text-[var(--color-muted-foreground)]"
          data-testid="invoices-empty"
        >
          <FileText className="h-10 w-10 opacity-40" aria-hidden="true" />
          <p className="text-sm">{t('invoices.list.empty')}</p>
        </div>
      )}

      {!loading && !error && data && filteredInvoices.length > 0 && (
        <>
          <Table data-testid="invoices-table">
            <TableHeader>
              <TableRow>
                <TableHead>{t('invoices.fields.number')}</TableHead>
                <TableHead>{t('invoices.fields.issueDate')}</TableHead>
                <TableHead>{t('invoices.fields.dueDate')}</TableHead>
                <TableHead>{t('invoices.fields.status', 'Status')}</TableHead>
                <TableHead className="text-right">{t('invoices.fields.total')}</TableHead>
                <TableHead className="w-36" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id} data-testid="invoice-row">
                  <TableCell className="font-medium">{invoice.number}</TableCell>
                  <TableCell>{invoice.issueDate}</TableCell>
                  <TableCell>{invoice.dueDate}</TableCell>
                  <TableCell>
                    <StatusBadge status={invoice.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    ${parseFloat(invoice.total).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/invoices/${invoice.id}`)}
                        aria-label={t('invoices.actions.preview')}
                        data-testid={`btn-preview-${invoice.id}`}
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      {invoice.status === 'DRAFT' && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(invoice)}
                            aria-label={t('invoices.detail.edit')}
                            data-testid={`btn-edit-${invoice.id}`}
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={!invoice.clientEmail || sendingId === invoice.id}
                            onClick={() => void handleSend(invoice)}
                            aria-label={t('invoices.actions.sendToClient')}
                            data-testid={`btn-send-${invoice.id}`}
                          >
                            <Send className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </>
                      )}
                      {invoice.status === 'SENT' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={payingId === invoice.id}
                          onClick={() => void handleMarkPaid(invoice)}
                          aria-label={t('invoices.actions.markAsPaid')}
                          data-testid={`btn-paid-${invoice.id}`}
                        >
                          <CheckCircle
                            className="h-4 w-4 text-[var(--color-status-paid-fg)]"
                            aria-hidden="true"
                          />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingInvoice(invoice)}
                        aria-label={t('invoices.detail.delete')}
                        data-testid={`btn-delete-${invoice.id}`}
                      >
                        <Trash2
                          className="h-4 w-4 text-[var(--color-destructive)]"
                          aria-hidden="true"
                        />
                      </Button>
                    </div>
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

      <InvoiceFormSheet
        open={sheetOpen}
        onClose={closeSheet}
        onSubmit={handleSubmit}
        editingInvoice={editingInvoice}
      />

      <ConfirmDeleteDialog
        open={!!deletingInvoice}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setDeletingInvoice(null)}
      />
    </div>
  );
}
