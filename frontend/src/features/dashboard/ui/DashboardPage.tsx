import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';
import { useClients } from '@/features/clients/api/useClients';
import { KpiCard } from './KpiCard';
import { RecentActivity } from './RecentActivity';
import { Button } from '@/shared/ui/button';

export function DashboardPage() {
  const { t } = useTranslation();
  const { data, loading, error, refetch } = useClients({ size: 1 });

  const totalClients = data?.totalElements ?? null;

  return (
    <div data-testid="home-page">
      <h1 className="mb-6 text-2xl font-bold text-[var(--color-foreground)]">
        {t('dashboard.title')}
      </h1>

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive"
          data-testid="dashboard-error"
        >
          <p>{error.message}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={refetch}
            data-testid="btn-retry"
          >
            {t('common.retry')}
          </Button>
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          title={t('dashboard.kpi.totalClients')}
          value={error ? null : totalClients}
          icon={<Users className="h-4 w-4" aria-hidden="true" />}
          loading={loading}
        />
        <KpiCard
          title={t('dashboard.kpi.activeClients')}
          value={error ? null : totalClients}
          icon={<Users className="h-4 w-4" aria-hidden="true" />}
          loading={loading}
        />
        <KpiCard title={t('dashboard.kpi.invoices')} value={0} loading={false} />
      </div>

      <RecentActivity />

      <div className="mt-6">
        <Link
          to="/clients"
          className="text-[var(--color-primary)] hover:underline"
          data-testid="link-clients"
        >
          {t('home.ctaClients')}
        </Link>
      </div>
    </div>
  );
}
