import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { useExpenses } from '../api/useExpenses';
import { useCreateExpense } from '../api/useCreateExpense';
import { useUpdateExpense } from '../api/useUpdateExpense';
import { useDeleteExpense } from '../api/useDeleteExpense';
import { useExpenseSummary } from '../api/useExpenseSummary';
import { ExpenseDashboard } from './ExpenseDashboard';
import { ExpenseTable } from './ExpenseTable';
import { ExpenseFormSheet } from './ExpenseFormSheet';
import { PageHeader } from '@/shared/components/PageHeader';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/shared/ui/dropdown-menu';
import type { ExpenseFormValues } from '../model/schema';
import type { Expense, ExpenseCategory } from '../model/types';
import { EXPENSE_CATEGORIES, categoryLabel } from '../model/categories';

function getCurrentMonth(): string {
  const d = new Date();
  return `${String(d.getFullYear())}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function ConfirmDeleteDialog({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
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
        <h2 className="mb-2 text-lg font-semibold">Delete Expense</h2>
        <p className="mb-4 text-sm text-[var(--color-muted-foreground)]">
          Are you sure you want to delete this expense? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel} data-testid="btn-cancel-delete">
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} data-testid="btn-confirm-delete">
            Delete
          </Button>
        </div>
      </div>
    </>
  );
}

type CategoryFilter = 'ALL' | ExpenseCategory;

export function ExpensesPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  const category = categoryFilter === 'ALL' ? undefined : categoryFilter;
  const { data, loading, error, refetch } = useExpenses(page, category);
  const {
    data: summary,
    loading: summaryLoading,
    refetch: refetchSummary,
  } = useExpenseSummary(selectedMonth);

  const { mutate: createMutate } = useCreateExpense();
  const { mutate: updateMutate } = useUpdateExpense();
  const { mutate: deleteMutate } = useDeleteExpense();

  function openCreate() {
    setEditingExpense(null);
    setSheetOpen(true);
  }

  function openEdit(expense: Expense) {
    setEditingExpense(expense);
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
    setEditingExpense(null);
  }

  const handleSubmit = useCallback(
    async (formData: ExpenseFormValues) => {
      const payload = {
        amount: formData.amount,
        category: formData.category,
        expenseDate: formData.expenseDate,
        description: formData.description ?? null,
      };
      if (editingExpense) {
        await updateMutate(editingExpense.id, payload);
        toast.success('Expense updated');
      } else {
        await createMutate(payload);
        toast.success('Expense created');
      }
      closeSheet();
      refetch();
      refetchSummary();
    },
    [editingExpense, createMutate, updateMutate, refetch, refetchSummary],
  );

  async function handleConfirmDelete() {
    if (!deletingExpense) return;
    try {
      await deleteMutate(deletingExpense.id);
      toast.success('Expense deleted');
      setDeletingExpense(null);
      refetch();
      refetchSummary();
    } catch {
      toast.error('Failed to delete expense');
      setDeletingExpense(null);
    }
  }

  const filteredExpenses =
    data?.content.filter((exp) => {
      if (!search) return true;
      return exp.description?.toLowerCase().includes(search.toLowerCase()) ?? false;
    }) ?? [];

  const categoryFilterLabel =
    categoryFilter === 'ALL'
      ? 'All'
      : t(`expenses.categories.${categoryFilter}`, categoryLabel(categoryFilter));

  return (
    <div data-testid="expenses-page" className="px-6 py-6">
      <PageHeader
        title="Expenses"
        actions={
          <Button onClick={openCreate} data-testid="btn-new-expense">
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Add Expense
          </Button>
        }
      />

      <ExpenseDashboard
        summary={summary}
        loading={summaryLoading}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
      />

      <div className="my-6 border-t border-[var(--color-border)]" />
      <h2 className="mb-4 text-base font-semibold text-[var(--color-foreground)]">All Expenses</h2>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex items-center sm:max-w-xs">
          <Input
            type="search"
            placeholder="Search by description…"
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
              onClick={() => {
                setSearch('');
                setPage(0);
              }}
              className="absolute right-2 flex items-center justify-center rounded p-0.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              data-testid="btn-clear-search"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" data-testid="category-filter-trigger">
              Category: {categoryFilterLabel}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent data-testid="category-filter-menu">
            <DropdownMenuItem onClick={() => setCategoryFilter('ALL')} data-testid="filter-all">
              All
            </DropdownMenuItem>
            {EXPENSE_CATEGORIES.map((cat) => (
              <DropdownMenuItem
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                data-testid={`filter-${cat.toLowerCase()}`}
              >
                {t(`expenses.categories.${cat}`, categoryLabel(cat))}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {error && (
        <p role="alert" className="py-4 text-center text-[var(--color-destructive)]">
          {error.message}
        </p>
      )}

      <ExpenseTable
        expenses={filteredExpenses}
        loading={loading}
        onEdit={openEdit}
        onDelete={(exp) => setDeletingExpense(exp)}
      />

      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-[var(--color-muted-foreground)]">
          <span>
            Page {page + 1} of {data.totalPages}
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
              onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))}
              disabled={page >= data.totalPages - 1}
              className="rounded border border-[var(--color-border)] px-3 py-1 disabled:opacity-40"
              data-testid="btn-next-page"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <ExpenseFormSheet
        open={sheetOpen}
        onClose={closeSheet}
        onSubmit={handleSubmit}
        editingExpense={editingExpense}
      />

      <ConfirmDeleteDialog
        open={!!deletingExpense}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setDeletingExpense(null)}
      />
    </div>
  );
}
