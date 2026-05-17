import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExpenseTable } from './ExpenseTable';
import type { Expense } from '../model/types';

const MOCK_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    amount: 42.5,
    category: 'FOOD_DRINK',
    description: 'Team lunch',
    expenseDate: '2026-05-10',
    createdAt: '2026-05-10T12:00:00Z',
    updatedAt: '2026-05-10T12:00:00Z',
  },
  {
    id: 'exp-2',
    amount: 99.0,
    category: 'TRANSPORT',
    description: null,
    expenseDate: '2026-05-09',
    createdAt: '2026-05-09T08:00:00Z',
    updatedAt: '2026-05-09T08:00:00Z',
  },
];

describe('ExpenseTable', () => {
  it('renders expense rows', () => {
    render(
      <ExpenseTable expenses={MOCK_EXPENSES} loading={false} onEdit={vi.fn()} onDelete={vi.fn()} />,
    );
    const rows = screen.getAllByTestId('expense-row');
    expect(rows).toHaveLength(2);
  });

  it('renders formatted amount', () => {
    render(
      <ExpenseTable expenses={MOCK_EXPENSES} loading={false} onEdit={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(screen.getByText('$42.50')).toBeInTheDocument();
    expect(screen.getByText('$99.00')).toBeInTheDocument();
  });

  it('renders category badge', () => {
    render(
      <ExpenseTable expenses={MOCK_EXPENSES} loading={false} onEdit={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(screen.getAllByTestId('category-badge').length).toBeGreaterThanOrEqual(1);
  });

  it('renders em dash for null description', () => {
    render(
      <ExpenseTable expenses={MOCK_EXPENSES} loading={false} onEdit={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('calls onEdit when edit button clicked', async () => {
    const onEdit = vi.fn();
    render(
      <ExpenseTable expenses={MOCK_EXPENSES} loading={false} onEdit={onEdit} onDelete={vi.fn()} />,
    );
    await userEvent.click(screen.getByTestId('btn-edit-exp-1'));
    expect(onEdit).toHaveBeenCalledWith(MOCK_EXPENSES[0]);
  });

  it('calls onDelete when delete button clicked', async () => {
    const onDelete = vi.fn();
    render(
      <ExpenseTable
        expenses={MOCK_EXPENSES}
        loading={false}
        onEdit={vi.fn()}
        onDelete={onDelete}
      />,
    );
    await userEvent.click(screen.getByTestId('btn-delete-exp-1'));
    expect(onDelete).toHaveBeenCalledWith(MOCK_EXPENSES[0]);
  });

  it('shows loading skeleton when loading', () => {
    render(<ExpenseTable expenses={[]} loading={true} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByTestId('expenses-loading')).toBeInTheDocument();
  });

  it('shows empty state when no expenses', () => {
    render(<ExpenseTable expenses={[]} loading={false} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByTestId('expenses-empty')).toBeInTheDocument();
  });

  it('renders date column', () => {
    render(
      <ExpenseTable expenses={MOCK_EXPENSES} loading={false} onEdit={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(screen.getByText('2026-05-10')).toBeInTheDocument();
  });
});
