<<<<<<< HEAD
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/features/auth/model/useAuthStore';
import { useDashboardStats } from '../api/useDashboardStats';
import { StatCard } from './StatCard';
import { RevenueChart } from './RevenueChart';
import { InvoiceStatusChart } from './InvoiceStatusChart';
import { Skeleton } from '@/shared/ui/skeleton';

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function DashboardPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { data, loading, error } = useDashboardStats();

  return (
    <div data-testid="home-page">
      <div data-testid="dashboard-page" className="space-y-6">
        {/* Welcome banner */}
        <div
          data-testid="welcome-banner"
          className="rounded-lg bg-[var(--color-sidebar-bg)] px-6 py-5 text-[var(--color-sidebar-text)]"
        >
          <h1 className="text-xl font-bold">
            {t('dashboard.welcome.title', { name: user?.displayName ?? user?.email ?? 'there' })}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-sidebar-muted)]">
            {t('dashboard.welcome.subtitle')}
          </p>
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div data-testid="dashboard-loading" className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Skeleton className="col-span-2 h-72 rounded-lg" />
              <Skeleton className="h-72 rounded-lg" />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <p role="alert" className="py-4 text-center text-[var(--color-destructive)]">
            {error.message}
          </p>
        )}

        {/* Content */}
        {!loading && !error && data && (
          <>
            {/* Stat cards */}
            <div data-testid="stat-cards" className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard
                label={t('dashboard.cards.totalInvoices')}
                value={String(data.totalInvoices)}
                sub={t('dashboard.cards.draft', { count: data.draftCount })}
                accent="default"
              />
              <StatCard
                label={t('dashboard.cards.totalRevenue')}
                value={formatCurrency(data.totalRevenue)}
                accent="amber"
              />
              <StatCard
                label={t('dashboard.cards.paidInvoices')}
                value={String(data.paidCount)}
                sub={formatCurrency(data.paidRevenue)}
                accent="green"
              />
              <StatCard
                label={t('dashboard.cards.pending')}
                value={String(data.sentCount)}
                sub={formatCurrency(data.pendingRevenue)}
                accent="blue"
              />
            </div>
<<<<<<< HEAD
          </div>
        </>
      )}
=======
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
>>>>>>> feat/FEAT-20260512-03-dashboard-core-ui
=======

            {/* Charts */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div
                data-testid="revenue-chart-section"
                className="col-span-2 rounded-lg bg-[var(--color-card)] p-5 shadow-sm"
              >
                <h2 className="mb-4 text-sm font-semibold text-[var(--color-foreground)]">
                  {t('dashboard.charts.revenueByMonth')}
                </h2>
                <RevenueChart data={data.revenueByMonth} />
              </div>

              <div
                data-testid="status-chart-section"
                className="rounded-lg bg-[var(--color-card)] p-5 shadow-sm"
              >
                <h2 className="mb-4 text-sm font-semibold text-[var(--color-foreground)]">
                  {t('dashboard.charts.invoiceStatus')}
                </h2>
                <InvoiceStatusChart
                  draftCount={data.draftCount}
                  sentCount={data.sentCount}
                  paidCount={data.paidCount}
                />
              </div>
            </div>
          </>
        )}
      </div>
>>>>>>> feat/FEAT-20260514-02-invoice-lifecycle
    </div>
  );
}
