import { useTranslation } from 'react-i18next';
import { CategoryIcon } from './CategoryIcon';
import { categoryLabel } from '../model/categories';
import type { ExpenseSummary } from '../model/types';

interface ExpenseDashboardProps {
  summary: ExpenseSummary | null;
  loading: boolean;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

function formatAmount(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function ExpenseDashboard({
  summary,
  loading,
  selectedMonth,
  onMonthChange,
}: ExpenseDashboardProps) {
  const { t } = useTranslation();
  const grandTotal = summary ? formatAmount(summary.grandTotal) : '$0.00';
  const byCategory = summary?.byCategory ?? [];

  // Parse month string YYYY-MM for the display label
  const [year, month] = selectedMonth.split('-');
  const monthName = new Date(`${year ?? ''}-${month ?? '01'}-01`).toLocaleString('en-US', {
    month: 'long',
  });
  const displayMonth = `${monthName} ${year ?? ''}`;

  return (
    <div data-testid="expense-dashboard">
      {/* Month picker */}
      <div className="mb-4 flex items-center gap-3">
        <label
          htmlFor="month-picker"
          className="text-sm font-medium text-[var(--color-foreground)]"
        >
          Month
        </label>
        <input
          id="month-picker"
          type="month"
          value={selectedMonth}
          onChange={(e) => onMonthChange(e.target.value)}
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-1.5 text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
          data-testid="month-picker"
        />
      </div>

      {/* Grand total summary card */}
      <div className="mb-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm">
        <p className="text-sm text-[var(--color-muted-foreground)]">Total for {displayMonth}</p>
        {loading ? (
          <div className="mt-1 h-8 w-32 animate-pulse rounded bg-[var(--color-muted)]" />
        ) : (
          <p
            className="mt-1 text-2xl font-semibold text-[var(--color-foreground)]"
            data-testid="grand-total"
          >
            {grandTotal}
          </p>
        )}
      </div>

      {/* Category cards */}
      {!loading && byCategory.length === 0 && (
        <div
          className="flex flex-col items-center gap-2 py-8 text-[var(--color-muted-foreground)]"
          data-testid="dashboard-empty"
        >
          <p className="text-sm">No expenses for {displayMonth}</p>
        </div>
      )}

      {byCategory.length > 0 && (
        <div
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
          data-testid="category-cards"
        >
          {byCategory.map((item) => (
            <div
              key={item.category}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3 shadow-sm"
              data-testid={`category-card-${item.category}`}
            >
              <div className="mb-2 flex items-center gap-2">
                <CategoryIcon category={item.category} className="h-4 w-4" />
                <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
                  {t(`expenses.categories.${item.category}`, categoryLabel(item.category))}
                </span>
              </div>
              <p className="text-lg font-semibold text-[var(--color-foreground)]">
                {formatAmount(item.total)}
              </p>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                {item.count} {item.count === 1 ? 'expense' : 'expenses'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
