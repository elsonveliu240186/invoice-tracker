import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/features/auth/model/useAuthStore';
import { useDashboardStats } from '../api/useDashboardStats';
import { useDashboardExpenseStats } from '../api/useDashboardExpenseStats';
import { StatCard } from './StatCard';
import { RevenueChart } from './RevenueChart';
import { InvoiceStatusChart } from './InvoiceStatusChart';
import { ExpenseByMonthChart } from './ExpenseByMonthChart';
import { ExpenseByCategoryChart } from './ExpenseByCategoryChart';
import { DashboardDateFilter } from './DashboardDateFilter';
import { Skeleton } from '@/shared/ui/skeleton';

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function DashboardPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);

  const { data, loading, error } = useDashboardStats(from, to);
  const {
    data: expenseData,
    loading: expenseLoading,
    error: expenseError,
  } = useDashboardExpenseStats(from, to);

  function handleFilterChange(newFrom: string | null, newTo: string | null) {
    setFrom(newFrom);
    setTo(newTo);
  }

  return (
    <div data-testid="home-page">
      <div data-testid="dashboard-page" className="space-y-6">
        {/* Welcome banner with date filter */}
        <div className="flex items-start justify-between gap-4">
          <div
            data-testid="welcome-banner"
            className="flex-1 rounded-lg bg-[var(--color-sidebar-bg)] px-6 py-5 text-[var(--color-sidebar-text)]"
          >
            <h1 className="text-xl font-bold">
              {t('dashboard.welcome.title', { name: user?.displayName ?? user?.email ?? 'there' })}
            </h1>
            <p className="mt-1 text-sm text-[var(--color-sidebar-muted)]">
              {t('dashboard.welcome.subtitle')}
            </p>
          </div>
          <div className="mt-1 flex-shrink-0">
            <DashboardDateFilter from={from} to={to} onChange={handleFilterChange} />
          </div>
        </div>

        {/* Loading skeletons — invoice section */}
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

        {/* Error — invoice section */}
        {error && (
          <p role="alert" className="py-4 text-center text-[var(--color-destructive)]">
            {error.message}
          </p>
        )}

        {/* Content — invoice section */}
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

            {/* Charts — invoice */}
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

        {/* Loading skeletons — expense section */}
        {expenseLoading && (
          <div data-testid="expense-loading" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Skeleton className="col-span-2 h-72 rounded-lg" />
            <Skeleton className="h-72 rounded-lg" />
          </div>
        )}

        {/* Error — expense section */}
        {expenseError && (
          <p
            role="alert"
            data-testid="expense-error"
            className="py-4 text-center text-[var(--color-destructive)]"
          >
            {t('dashboard.errors.expenses')}
          </p>
        )}

        {/* Charts — expense section */}
        {!expenseLoading && !expenseError && expenseData && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div
              data-testid="expense-by-month-section"
              className="col-span-2 rounded-lg bg-[var(--color-card)] p-5 shadow-sm"
            >
              <h2 className="mb-4 text-sm font-semibold text-[var(--color-foreground)]">
                {t('dashboard.charts.expenseByMonth')}
              </h2>
              <ExpenseByMonthChart data={expenseData.expenseByMonth} />
            </div>

            <div
              data-testid="expense-by-category-section"
              className="rounded-lg bg-[var(--color-card)] p-5 shadow-sm"
            >
              <h2 className="mb-4 text-sm font-semibold text-[var(--color-foreground)]">
                {t('dashboard.charts.expenseByCategory')}
              </h2>
              <ExpenseByCategoryChart data={expenseData.expenseByCategory} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
