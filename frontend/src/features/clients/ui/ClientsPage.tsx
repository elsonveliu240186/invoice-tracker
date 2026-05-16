import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from '../api/useClients';
import { ClientTable } from './ClientTable';
import { ClientFormSheet } from './ClientFormSheet';
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog';
import { useToast } from '@/shared/ui/Toast';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { PageHeader } from '@/shared/components/PageHeader';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/shared/ui/dropdown-menu';
import { deriveStatus } from '../model/derive';
import type { Client, ClientQuery } from '../model/types';
import type { ClientStatus } from '../model/derive';
import type { CreateClientInput } from '../model/schema';

const PAGE_SIZE = 20;

type StatusFilter = 'ALL' | ClientStatus;

export function ClientsPage() {
  const { t } = useTranslation();
  const { show } = useToast();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  const query: ClientQuery = {
    page,
    size: PAGE_SIZE,
  };
  if (search) {
    query.query = search;
  }

  const { data, loading, error, refetch } = useClients(query);

  // Sheet state (replaces modal)
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Confirm delete state
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);

  const { mutate: createMutate } = useCreateClient();
  const { mutate: updateMutate } = useUpdateClient();
  const { mutate: deleteMutate } = useDeleteClient();

  function openCreate() {
    setEditingClient(null);
    setSheetOpen(true);
  }

  function openEdit(client: Client) {
    setEditingClient(client);
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
    setEditingClient(null);
  }

  function clearSearch() {
    setSearch('');
    setPage(0);
  }

  function resetFilters() {
    setSearch('');
    setPage(0);
    setStatusFilter('ALL');
  }

  const handleSubmit = useCallback(
    async (formData: CreateClientInput) => {
      const payload = {
        name: formData.name,
        email: formData.email,
        ...(formData.phone ? { phone: formData.phone } : {}),
        ...(formData.address ? { address: formData.address } : {}),
      };
      if (editingClient) {
        await updateMutate(editingClient.id, payload);
        show(t('clients.toast.updated'), 'success');
      } else {
        await createMutate(payload);
        show(t('clients.toast.created'), 'success');
      }
      closeSheet();
      refetch();
    },
    [editingClient, updateMutate, createMutate, show, refetch, t],
  );

  async function handleConfirmDelete() {
    if (!deletingClient) return;
    try {
      await deleteMutate(deletingClient.id);
      show(t('clients.toast.deleted'), 'success');
      setDeletingClient(null);
      refetch();
    } catch {
      show(t('clients.toast.deleteFailed'), 'error');
      setDeletingClient(null);
    }
  }

  const totalPages = data?.totalPages ?? 0;

  // Client-side status filter applied to current page content
  const filteredClients =
    data?.content.filter((c) => {
      if (statusFilter === 'ALL') return true;
      return deriveStatus(c) === statusFilter;
    }) ?? [];

  const statusFilterLabel =
    statusFilter === 'ALL'
      ? t('clients.status.all')
      : statusFilter === 'ACTIVE'
        ? t('clients.status.active')
        : t('clients.status.inactive');

  return (
    <div data-testid="clients-page">
      <PageHeader
        title={t('clients.title')}
        actions={
          <Button onClick={openCreate} data-testid="btn-new-client">
            {t('clients.newClient')}
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
<<<<<<< HEAD
        <div className="relative flex items-center sm:max-w-xs">
          <Input
            type="search"
            placeholder={t('clients.searchPlaceholder')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                clearSearch();
              }
            }}
            className="pr-8 sm:max-w-xs"
            data-testid="search-input"
            aria-label="Search clients"
          />
          {search.length > 0 && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label={t('clients.clearSearch')}
              data-testid="btn-clear-search"
              className="absolute right-2 flex items-center justify-center rounded p-0.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
=======
        <Input
          type="search"
          placeholder={t('clients.searchPlaceholder')}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          className="sm:max-w-xs"
          data-testid="search-input"
          aria-label="Search clients"
        />
>>>>>>> feat/FEAT-20260512-03-dashboard-core-ui

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" data-testid="status-filter-trigger">
              {t('clients.statusFilter')}: {statusFilterLabel}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent data-testid="status-filter-menu">
            <DropdownMenuItem onClick={() => setStatusFilter('ALL')} data-testid="filter-all">
              {t('clients.status.all')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('ACTIVE')} data-testid="filter-active">
              {t('clients.status.active')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setStatusFilter('INACTIVE')}
              data-testid="filter-inactive"
            >
              {t('clients.status.inactive')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
<<<<<<< HEAD

        <Button variant="ghost" size="sm" onClick={resetFilters} data-testid="btn-reset-filters">
          {t('clients.resetFilters')}
        </Button>
=======
>>>>>>> feat/FEAT-20260512-03-dashboard-core-ui
      </div>

      {loading && (
        <p
          className="py-8 text-center text-[var(--color-muted-foreground)]"
          data-testid="loading-indicator"
        >
          {t('common.loading')}
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="py-4 text-center text-[var(--color-destructive)]"
          data-testid="error-message"
        >
          {error.message}
        </p>
      )}

      {!loading && !error && data && (
        <>
          <ClientTable
            clients={filteredClients}
            onEdit={openEdit}
            onDelete={(c) => setDeletingClient(c)}
          />

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-[var(--color-muted-foreground)]">
              <span>
                {t('common.page', { page: page + 1, total: totalPages })} ({data.totalElements}{' '}
                total)
              </span>
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
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
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

      <ClientFormSheet
        open={sheetOpen}
        onClose={closeSheet}
        onSubmit={handleSubmit}
        editingClient={editingClient}
      />

      <ConfirmDeleteDialog
        open={!!deletingClient}
        clientName={deletingClient?.name ?? ''}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
        onCancel={() => setDeletingClient(null)}
      />
    </div>
  );
}
