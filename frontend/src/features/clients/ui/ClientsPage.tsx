import { useState, useCallback } from 'react';
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from '../api/useClients';
import { ClientTable } from './ClientTable';
import { ClientFormModal } from './ClientFormModal';
import { ClientForm } from './ClientForm';
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog';
import { useToast } from '@/shared/ui/Toast';
import type { Client, ClientQuery } from '../model/types';
import type { CreateClientInput } from '../model/schema';

const PAGE_SIZE = 20;

export function ClientsPage() {
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
        show('Client updated', 'success');
      } else {
        await createMutate(payload);
        show('Client created', 'success');
      }
      closeModal();
      refetch();
    },
    [editingClient, updateMutate, createMutate, show, refetch],
  );

  async function handleConfirmDelete() {
    if (!deletingClient) return;
    try {
      await deleteMutate(deletingClient.id);
      show('Client deleted', 'success');
      setDeletingClient(null);
      refetch();
    } catch {
      show('Failed to delete client', 'error');
      setDeletingClient(null);
    }
  }

  const totalPages = data?.totalPages ?? 0;

  const initialForForm: Partial<Client> | undefined = editingClient ?? undefined;

  return (
    <main className="mx-auto max-w-5xl p-6" data-testid="clients-page">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clients</h1>
        <button
          onClick={openCreate}
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          data-testid="btn-new-client"
        >
          New client
        </button>
      </div>

      <div className="mb-4">
        <input
          type="search"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:max-w-xs"
          data-testid="search-input"
          aria-label="Search clients"
        />
      </div>

      {loading && (
        <p className="py-8 text-center text-slate-400" data-testid="loading-indicator">
          Loading…
        </p>
      )}

      {error && (
        <p role="alert" className="py-4 text-center text-red-600" data-testid="error-message">
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
            <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
              <span>
                Page {page + 1} of {totalPages} ({data.totalElements} total)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="rounded border px-3 py-1 disabled:opacity-40"
                  data-testid="btn-prev-page"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="rounded border px-3 py-1 disabled:opacity-40"
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
        title={editingClient ? 'Edit client' : 'New client'}
        open={modalOpen}
        onClose={closeModal}
      >
        {modalOpen && (
          <ClientForm
            initial={initialForForm}
            onSubmit={handleSubmit}
            onCancel={closeModal}
            submitLabel={editingClient ? 'Update' : 'Create'}
          />
        )}
      </ClientFormModal>

      <ConfirmDeleteDialog
        open={!!deletingClient}
        clientName={deletingClient?.name ?? ''}
        onConfirm={() => { void handleConfirmDelete(); }}
        onCancel={() => setDeletingClient(null)}
      />
    </main>
  );
}
