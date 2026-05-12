import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from '../api/useClients';
import { ClientTable } from './ClientTable';
import { ClientFormModal } from './ClientFormModal';
import { ClientForm } from './ClientForm';
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog';
import { useToast } from '@/shared/ui/Toast';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { PageHeader } from '@/shared/components/PageHeader';
import type { Client, ClientQuery } from '../model/types';
import type { CreateClientInput } from '../model/schema';

const PAGE_SIZE = 20;

export function ClientsPage() {
  const { t } = useTranslation();
  const { show } = useToast();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const query: ClientQuery = {
    page,
    size: PAGE_SIZE,
  };
  if (search) {
    query.query = search;
  }

  const { data, loading, error, refetch } = useClients(query);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Confirm delete state
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);

  const { mutate: createMutate } = useCreateClient();
  const { mutate: updateMutate } = useUpdateClient();
  const { mutate: deleteMutate } = useDeleteClient();

  function openCreate() {
    setEditingClient(null);
    setModalOpen(true);
  }

  function openEdit(client: Client) {
    setEditingClient(client);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingClient(null);
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
      closeModal();
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

  const initialForForm: Partial<Client> | undefined = editingClient ?? undefined;

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

      <div className="mb-4">
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
            clients={data.content}
            onEdit={openEdit}
            onDelete={(c) => setDeletingClient(c)}
          />

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-[var(--color-muted-foreground)]">
              <span>
                Page {page + 1} of {totalPages} ({data.totalElements} total)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="rounded border border-[var(--color-border)] px-3 py-1 disabled:opacity-40"
                  data-testid="btn-prev-page"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="rounded border border-[var(--color-border)] px-3 py-1 disabled:opacity-40"
                  data-testid="btn-next-page"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <ClientFormModal
        title={editingClient ? t('common.edit') + ' client' : t('clients.newClient')}
        open={modalOpen}
        onClose={closeModal}
      >
        {modalOpen && (
          <ClientForm
            initial={initialForForm}
            onSubmit={handleSubmit}
            onCancel={closeModal}
            submitLabel={editingClient ? 'Update' : t('common.create')}
          />
        )}
      </ClientFormModal>

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
