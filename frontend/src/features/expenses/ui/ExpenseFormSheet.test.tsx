import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExpenseFormSheet } from './ExpenseFormSheet';
import type { Expense } from '../model/types';

const TODAY = new Date().toISOString().slice(0, 10);

const EDITING_EXPENSE: Expense = {
  id: 'exp-1',
  amount: 42.5,
  category: 'FOOD_DRINK',
  description: 'Team lunch',
  expenseDate: '2026-05-10',
  createdAt: '2026-05-10T12:00:00Z',
  updatedAt: '2026-05-10T12:00:00Z',
};

describe('ExpenseFormSheet', () => {
  it('does not render when closed', () => {
    render(
      <ExpenseFormSheet open={false} onClose={vi.fn()} onSubmit={vi.fn()} editingExpense={null} />,
    );
    expect(screen.queryByTestId('expense-form-sheet')).not.toBeInTheDocument();
  });

  it('renders dialog when open', () => {
    render(
      <ExpenseFormSheet open={true} onClose={vi.fn()} onSubmit={vi.fn()} editingExpense={null} />,
    );
    expect(screen.getByTestId('expense-form-sheet')).toBeInTheDocument();
  });

  it('shows "New Expense" title in create mode', () => {
    render(
      <ExpenseFormSheet open={true} onClose={vi.fn()} onSubmit={vi.fn()} editingExpense={null} />,
    );
    expect(screen.getByText('New Expense')).toBeInTheDocument();
  });

  it('shows "Edit Expense" title in edit mode', () => {
    render(
      <ExpenseFormSheet
        open={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        editingExpense={EDITING_EXPENSE}
      />,
    );
    expect(screen.getByText('Edit Expense')).toBeInTheDocument();
  });

  it('pre-fills fields in edit mode', () => {
    render(
      <ExpenseFormSheet
        open={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        editingExpense={EDITING_EXPENSE}
      />,
    );
    const amountInput = screen.getByTestId('input-amount');
    expect((amountInput as HTMLInputElement).value).toBe('42.5');
    const categorySelect = screen.getByTestId('select-category');
    expect((categorySelect as HTMLSelectElement).value).toBe('FOOD_DRINK');
  });

  it('calls onClose when close button clicked', async () => {
    const onClose = vi.fn();
    render(
      <ExpenseFormSheet open={true} onClose={onClose} onSubmit={vi.fn()} editingExpense={null} />,
    );
    await userEvent.click(screen.getByTestId('sheet-close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when cancel button clicked', async () => {
    const onClose = vi.fn();
    render(
      <ExpenseFormSheet open={true} onClose={onClose} onSubmit={vi.fn()} editingExpense={null} />,
    );
    await userEvent.click(screen.getByTestId('btn-cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when backdrop clicked', async () => {
    const onClose = vi.fn();
    render(
      <ExpenseFormSheet open={true} onClose={onClose} onSubmit={vi.fn()} editingExpense={null} />,
    );
    await userEvent.click(screen.getByTestId('sheet-backdrop'));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows validation error when submitting with no amount', async () => {
    render(
      <ExpenseFormSheet open={true} onClose={vi.fn()} onSubmit={vi.fn()} editingExpense={null} />,
    );
    // Set date to today to avoid future-date error, clear amount
    const amountInput = screen.getByTestId('input-amount');
    await userEvent.clear(amountInput);

    const dateInput = screen.getByTestId('input-expenseDate');
    await userEvent.clear(dateInput);
    await userEvent.type(dateInput, TODAY);

    await userEvent.click(screen.getByTestId('btn-submit'));

    await waitFor(() => {
      expect(screen.queryAllByRole('alert').length).toBeGreaterThan(0);
    });
  });

  it('calls onSubmit with valid form data', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <ExpenseFormSheet open={true} onClose={vi.fn()} onSubmit={onSubmit} editingExpense={null} />,
    );

    const amountInput = screen.getByTestId('input-amount');
    await userEvent.clear(amountInput);
    await userEvent.type(amountInput, '25.00');

    const dateInput = screen.getByTestId('input-expenseDate');
    await userEvent.clear(dateInput);
    await userEvent.type(dateInput, TODAY);

    const categorySelect = screen.getByTestId('select-category');
    await userEvent.selectOptions(categorySelect, 'TRANSPORT');

    await userEvent.click(screen.getByTestId('btn-submit'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 25,
          category: 'TRANSPORT',
        }),
      );
    });
  });

  it('shows "Update" submit label in edit mode', () => {
    render(
      <ExpenseFormSheet
        open={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        editingExpense={EDITING_EXPENSE}
      />,
    );
    expect(screen.getByTestId('btn-submit')).toHaveTextContent('Update');
  });

  it('shows "Create" submit label in create mode', () => {
    render(
      <ExpenseFormSheet open={true} onClose={vi.fn()} onSubmit={vi.fn()} editingExpense={null} />,
    );
    expect(screen.getByTestId('btn-submit')).toHaveTextContent('Create');
  });
});
