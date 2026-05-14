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
    );
  }

  if (error || !client) {
    return (
      <div data-testid="client-detail-not-found">
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
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6" data-testid="client-detail-page">
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
    </div>
  );
}
