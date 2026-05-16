<<<<<<< HEAD
import { useParams, Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useClient } from '../api/useClients';
import { formatDate } from '../model/derive';
import { ClientStatusBadge } from './ClientStatusBadge';
import { deriveStatus } from '../model/derive';

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { data: client, loading, error } = useClient(id ?? null);

  if (loading) {
    return (
      <p
        className="py-8 text-center text-[var(--color-muted-foreground)]"
        data-testid="client-detail-loading"
      >
        {t('common.loading')}
      </p>
=======
import { useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { useClient, useUpdateClient, useDeleteClient } from '../api/useClients';
import { ClientFormSheet } from './ClientFormSheet';
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog';
import { ClientStatusBadge } from './ClientStatusBadge';
import { deriveStatus, formatDate } from '../model/derive';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import { Button } from '@/shared/ui/button';
import { useToast } from '@/shared/ui/Toast';
import type { CreateClientInput } from '../model/schema';

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { show } = useToast();

  const { data: client, loading, error } = useClient(id ?? null);
  const { mutate: updateMutate } = useUpdateClient();
  const { mutate: deleteMutate } = useDeleteClient();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleSubmit = useCallback(
    async (formData: CreateClientInput) => {
      if (!client) return;
      const payload = {
        name: formData.name,
        email: formData.email,
        ...(formData.phone ? { phone: formData.phone } : {}),
        ...(formData.address ? { address: formData.address } : {}),
      };
      await updateMutate(client.id, payload);
      show(t('clients.toast.updated'), 'success');
      setSheetOpen(false);
    },
    [client, updateMutate, show, t],
  );

  async function handleConfirmDelete() {
    if (!client) return;
    try {
      await deleteMutate(client.id);
      show(t('clients.toast.deleted'), 'success');
      void navigate('/clients');
    } catch {
      show(t('clients.toast.deleteFailed'), 'error');
    }
    setDeleteOpen(false);
  }

  if (loading) {
    return (
      <div data-testid="client-detail-loading">
        <Skeleton className="mb-4 h-8 w-48" />
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
          </CardContent>
        </Card>
      </div>
>>>>>>> feat/FEAT-20260512-03-dashboard-core-ui
    );
  }

  if (error || !client) {
    return (
      <div data-testid="client-detail-not-found">
<<<<<<< HEAD
        <p role="alert" className="py-8 text-center text-[var(--color-destructive)]">
          {t('clientDetail.notFound')}
        </p>
        <div className="flex justify-center">
          <Link
            to="/clients"
            className="text-sm text-[var(--color-primary)] underline underline-offset-2 hover:opacity-80"
          >
            {t('clientDetail.backToList')}
          </Link>
        </div>
=======
        <p className="mb-4 text-[var(--color-muted-foreground)]">{t('clientDetail.notFound')}</p>
        <Link
          to="/clients"
          className="text-[var(--color-primary)] hover:underline"
          data-testid="link-back-to-clients"
        >
          {t('clientDetail.backToList')}
        </Link>
>>>>>>> feat/FEAT-20260512-03-dashboard-core-ui
      </div>
    );
  }

<<<<<<< HEAD
  return (
    <div className="space-y-6" data-testid="client-detail-page">
      <div className="flex items-center gap-4">
        <Link
          to="/clients"
          className="text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          data-testid="back-to-clients"
        >
          ← {t('clientDetail.backToList')}
        </Link>
      </div>

      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">{client.name}</h1>
          <ClientStatusBadge status={deriveStatus(client)} />
        </div>

        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
          {t('clientDetail.contactInfo')}
        </h2>

        <dl className="space-y-2">
          <div className="flex gap-2">
            <dt className="w-24 shrink-0 text-sm font-medium text-[var(--color-muted-foreground)]">
              Email
            </dt>
            <dd className="text-sm text-[var(--color-foreground)]">{client.email}</dd>
          </div>
          {client.phone && (
            <div className="flex gap-2">
              <dt className="w-24 shrink-0 text-sm font-medium text-[var(--color-muted-foreground)]">
                Phone
              </dt>
              <dd className="text-sm text-[var(--color-foreground)]">{client.phone}</dd>
            </div>
          )}
          {client.address && (
            <div className="flex gap-2">
              <dt className="w-24 shrink-0 text-sm font-medium text-[var(--color-muted-foreground)]">
                Address
              </dt>
              <dd className="text-sm text-[var(--color-foreground)]">{client.address}</dd>
            </div>
          )}
          <div className="flex gap-2">
            <dt className="w-24 shrink-0 text-sm font-medium text-[var(--color-muted-foreground)]">
              {t('clientDetail.createdAt')}
            </dt>
            <dd className="text-sm text-[var(--color-foreground)]">
              {formatDate(client.createdAt)}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-24 shrink-0 text-sm font-medium text-[var(--color-muted-foreground)]">
              {t('clientDetail.updatedAt')}
            </dt>
            <dd className="text-sm text-[var(--color-foreground)]">
              {formatDate(client.updatedAt)}
            </dd>
          </div>
        </dl>
      </div>
=======
  const status = deriveStatus(client);

  return (
    <div data-testid="client-detail-page">
      <div className="mb-4 flex items-center gap-2">
        <Link
          to="/clients"
          className="inline-flex items-center gap-1 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          data-testid="link-back-to-clients"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t('clientDetail.backToList')}
        </Link>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">{client.name}</h1>
          <ClientStatusBadge status={status} />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSheetOpen(true)}
            data-testid="btn-edit-client"
          >
            <Pencil className="mr-1 h-4 w-4" aria-hidden="true" />
            {t('clients.action.edit')}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteOpen(true)}
            data-testid="btn-delete-client"
          >
            <Trash2 className="mr-1 h-4 w-4" aria-hidden="true" />
            {t('clients.action.delete')}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('clientDetail.contactInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              {t('clients.form.email')}
            </p>
            <p className="text-sm font-medium" data-testid="client-email">
              {client.email}
            </p>
          </div>
          {client.phone && (
            <div>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                {t('clients.form.phone')}
              </p>
              <p className="text-sm font-medium" data-testid="client-phone">
                {client.phone}
              </p>
            </div>
          )}
          {client.address && (
            <div>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                {t('clients.form.address')}
              </p>
              <p className="text-sm font-medium" data-testid="client-address">
                {client.address}
              </p>
            </div>
          )}
          <div className="border-t border-[var(--color-border)] pt-3">
            <p className="text-xs text-[var(--color-muted-foreground)]">
              {t('clientDetail.createdAt')}:{' '}
              <span data-testid="client-created-at">{formatDate(client.createdAt)}</span>
            </p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              {t('clientDetail.updatedAt')}:{' '}
              <span data-testid="client-updated-at">{formatDate(client.updatedAt)}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      <ClientFormSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSubmit={handleSubmit}
        editingClient={client}
      />

      <ConfirmDeleteDialog
        open={deleteOpen}
        clientName={client.name}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
        onCancel={() => setDeleteOpen(false)}
      />
>>>>>>> feat/FEAT-20260512-03-dashboard-core-ui
    </div>
  );
}
