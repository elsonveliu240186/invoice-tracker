import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { expenseFormSchema } from '../model/schema';
import type { ExpenseFormValues } from '../model/schema';
import { EXPENSE_CATEGORIES, categoryLabel } from '../model/categories';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import type { Expense } from '../model/types';

interface ExpenseFormSheetProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ExpenseFormValues) => Promise<void>;
  editingExpense: Expense | null;
}

export function ExpenseFormSheet({
  open,
  onClose,
  onSubmit,
  editingExpense,
}: ExpenseFormSheetProps) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      category: 'OTHER' as const,
      expenseDate: '',
      description: null,
    },
  });

  useEffect(() => {
    if (open) {
      if (editingExpense) {
        reset({
          amount: editingExpense.amount,
          category: editingExpense.category,
          expenseDate: editingExpense.expenseDate,
          description: editingExpense.description ?? null,
        });
      } else {
        const today = new Date();
        const todayStr = `${String(today.getFullYear())}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        reset({
          category: 'OTHER',
          expenseDate: todayStr,
          description: null,
        });
      }
    }
  }, [open, editingExpense, reset]);

  if (!open) return null;

  const title = editingExpense ? 'Edit Expense' : 'New Expense';

  async function handleFormSubmit(data: ExpenseFormValues) {
    await onSubmit(data);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
        data-testid="sheet-backdrop"
      />
      {/* Centered dialog panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="expense-sheet-title"
        className="fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-full max-w-md -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg bg-[var(--color-background)] shadow-xl"
        data-testid="expense-form-sheet"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
          <h2
            id="expense-sheet-title"
            className="text-lg font-semibold text-[var(--color-foreground)]"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-sm p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
            data-testid="sheet-close"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <form
            onSubmit={(e) => {
              void handleSubmit(handleFormSubmit)(e);
            }}
            noValidate
            data-testid="expense-form"
          >
            {/* Expense Date */}
            <div className="mb-4">
              <label
                htmlFor="expenseDate"
                className="mb-1 block text-sm font-medium text-[var(--color-foreground)]"
              >
                Date <span className="text-[var(--color-destructive)]">*</span>
              </label>
              <Input
                id="expenseDate"
                type="date"
                {...register('expenseDate')}
                data-testid="input-expenseDate"
              />
              {errors.expenseDate && (
                <p className="mt-1 text-xs text-[var(--color-destructive)]" role="alert">
                  {errors.expenseDate.message}
                </p>
              )}
            </div>

            {/* Category */}
            <div className="mb-4">
              <label
                htmlFor="category"
                className="mb-1 block text-sm font-medium text-[var(--color-foreground)]"
              >
                Category <span className="text-[var(--color-destructive)]">*</span>
              </label>
              <select
                id="category"
                {...register('category')}
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
                data-testid="select-category"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {t(`expenses.categories.${cat}`, categoryLabel(cat))}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-xs text-[var(--color-destructive)]" role="alert">
                  {errors.category.message}
                </p>
              )}
            </div>

            {/* Amount */}
            <div className="mb-4">
              <label
                htmlFor="amount"
                className="mb-1 block text-sm font-medium text-[var(--color-foreground)]"
              >
                Amount <span className="text-[var(--color-destructive)]">*</span>
              </label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                max="9999999.99"
                {...register('amount', { valueAsNumber: true })}
                placeholder="0.00"
                data-testid="input-amount"
              />
              {errors.amount && (
                <p className="mt-1 text-xs text-[var(--color-destructive)]" role="alert">
                  {errors.amount.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="mb-6">
              <label
                htmlFor="description"
                className="mb-1 block text-sm font-medium text-[var(--color-foreground)]"
              >
                Description <span className="text-[var(--color-muted-foreground)]">(optional)</span>
              </label>
              <textarea
                id="description"
                {...register('description')}
                rows={3}
                maxLength={500}
                placeholder="What was this expense for?"
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
                data-testid="input-description"
              />
              {errors.description && (
                <p className="mt-1 text-xs text-[var(--color-destructive)]" role="alert">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={onClose} data-testid="btn-cancel">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} data-testid="btn-submit">
                {isSubmitting ? 'Saving…' : editingExpense ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
