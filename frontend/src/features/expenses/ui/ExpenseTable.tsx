import { Pencil, Trash2 } from 'lucide-react';
import { CategoryBadge } from './CategoryBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import type { Expense } from '../model/types';

interface ExpenseTableProps {
  expenses: Expense[];
  loading: boolean;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

function formatAmount(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function ExpenseTable({ expenses, loading, onEdit, onDelete }: ExpenseTableProps) {
  if (loading) {
    return (
      <div className="space-y-2" data-testid="expenses-loading">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div
        className="flex flex-col items-center gap-2 py-12 text-[var(--color-muted-foreground)]"
        data-testid="expenses-empty"
      >
        <p className="text-sm">No expenses found.</p>
      </div>
    );
  }

  return (
    <Table data-testid="expenses-table">
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="w-24" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {expenses.map((expense) => (
          <TableRow key={expense.id} data-testid="expense-row">
            <TableCell>{expense.expenseDate}</TableCell>
            <TableCell>
              <CategoryBadge category={expense.category} />
            </TableCell>
            <TableCell className="max-w-xs truncate text-[var(--color-muted-foreground)]">
              {expense.description ?? '—'}
            </TableCell>
            <TableCell className="text-right font-medium">{formatAmount(expense.amount)}</TableCell>
            <TableCell>
              <div className="flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(expense)}
                  aria-label="Edit expense"
                  data-testid={`btn-edit-${expense.id}`}
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(expense)}
                  aria-label="Delete expense"
                  data-testid={`btn-delete-${expense.id}`}
                >
                  <Trash2 className="h-4 w-4 text-[var(--color-destructive)]" aria-hidden="true" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
