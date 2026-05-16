import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { ExpensesPage } from './ExpensesPage';
import { resetMockExpenses } from '@/mocks/handlers';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: () => null,
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <ExpensesPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  resetMockExpenses();
  vi.clearAllMocks();
});

describe('ExpensesPage', () => {
  it('renders the page header', () => {
    renderPage();
    expect(screen.getByText('Expenses')).toBeInTheDocument();
  });

  it('renders the Add Expense button', () => {
    renderPage();
    expect(screen.getByTestId('btn-new-expense')).toBeInTheDocument();
  });

  it('loads and displays expenses in the table', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.queryByTestId('expenses-loading')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('expenses-table')).toBeInTheDocument();
    expect(screen.getAllByTestId('expense-row').length).toBeGreaterThanOrEqual(1);
  });

  it('loads and displays the dashboard', () => {
    renderPage();
    expect(screen.getByTestId('expense-dashboard')).toBeInTheDocument();
  });

  it('opens the form sheet when Add Expense clicked', async () => {
    renderPage();
    await userEvent.click(screen.getByTestId('btn-new-expense'));
    expect(screen.getByTestId('expense-form-sheet')).toBeInTheDocument();
    expect(screen.getByText('New Expense')).toBeInTheDocument();
  });

  it('closes the form sheet when cancel is clicked', async () => {
    renderPage();
    await userEvent.click(screen.getByTestId('btn-new-expense'));
    expect(screen.getByTestId('expense-form-sheet')).toBeInTheDocument();
    await userEvent.click(screen.getByTestId('btn-cancel'));
    expect(screen.queryByTestId('expense-form-sheet')).not.toBeInTheDocument();
  });

  it('closes the form sheet on backdrop click', async () => {
    renderPage();
    await userEvent.click(screen.getByTestId('btn-new-expense'));
    await userEvent.click(screen.getByTestId('sheet-backdrop'));
    expect(screen.queryByTestId('expense-form-sheet')).not.toBeInTheDocument();
  });

  it('shows create form and submits successfully', async () => {
    const { toast } = await import('sonner');
    const today = new Date().toISOString().slice(0, 10);

    renderPage();
    await userEvent.click(screen.getByTestId('btn-new-expense'));

    const amountInput = screen.getByTestId('input-amount');
    await userEvent.clear(amountInput);
    await userEvent.type(amountInput, '30.00');

    const dateInput = screen.getByTestId('input-expenseDate');
    await userEvent.clear(dateInput);
    await userEvent.type(dateInput, today);

    const categorySelect = screen.getByTestId('select-category');
    await userEvent.selectOptions(categorySelect, 'SHOPPING');

    await userEvent.click(screen.getByTestId('btn-submit'));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Expense created');
    });
    expect(screen.queryByTestId('expense-form-sheet')).not.toBeInTheDocument();
  });

  it('opens edit form pre-populated when edit button clicked', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.queryByTestId('expenses-loading')).not.toBeInTheDocument();
    });

    const editBtn = screen.getByTestId('btn-edit-exp-uuid-1');
    await userEvent.click(editBtn);

    expect(screen.getByTestId('expense-form-sheet')).toBeInTheDocument();
    expect(screen.getByText('Edit Expense')).toBeInTheDocument();

    const amountInput = screen.getByTestId('input-amount');
    expect(parseFloat((amountInput as HTMLInputElement).value)).toBeCloseTo(42.5);
  });

  it('shows confirm delete dialog when delete button clicked', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.queryByTestId('expenses-loading')).not.toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('btn-delete-exp-uuid-1'));
    expect(screen.getByTestId('confirm-delete-dialog')).toBeInTheDocument();
  });

  it('cancels delete when cancel button clicked in dialog', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.queryByTestId('expenses-loading')).not.toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('btn-delete-exp-uuid-1'));
    expect(screen.getByTestId('confirm-delete-dialog')).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('btn-cancel-delete'));
    expect(screen.queryByTestId('confirm-delete-dialog')).not.toBeInTheDocument();
  });

  it('confirms delete and shows success toast', async () => {
    const { toast } = await import('sonner');
    renderPage();
    await waitFor(() => {
      expect(screen.queryByTestId('expenses-loading')).not.toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('btn-delete-exp-uuid-1'));
    await userEvent.click(screen.getByTestId('btn-confirm-delete'));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Expense deleted');
    });
  });

  it('filters by description search', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.queryByTestId('expenses-loading')).not.toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('search-input');
    await userEvent.type(searchInput, 'nomatch12345');

    await waitFor(() => {
      expect(screen.getByTestId('expenses-empty')).toBeInTheDocument();
    });
  });

  it('clears search when X button clicked', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.queryByTestId('expenses-loading')).not.toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('search-input');
    await userEvent.type(searchInput, 'something');
    expect(screen.getByTestId('btn-clear-search')).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('btn-clear-search'));
    expect((searchInput as HTMLInputElement).value).toBe('');
  });

  it('renders category filter dropdown', () => {
    renderPage();
    expect(screen.getByTestId('category-filter-trigger')).toBeInTheDocument();
  });

  it('renders All Expenses section heading', () => {
    renderPage();
    expect(screen.getByText('All Expenses')).toBeInTheDocument();
  });

  it('shows error alert when list fetch fails', async () => {
    server.use(
      http.get('/api/v1/expenses', () =>
        HttpResponse.json({ status: 500, detail: 'Server error' }, { status: 500 }),
      ),
    );
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('shows pagination and navigates to next page', async () => {
    // Seed 25 expenses to force totalPages > 1
    const expenses = Array.from({ length: 25 }, (_, i) => ({
      id: `exp-p-${i}`,
      amount: 10.0,
      category: 'OTHER' as const,
      description: `expense ${i}`,
      expenseDate: '2026-05-10',
      createdAt: '2026-05-10T00:00:00Z',
      updatedAt: '2026-05-10T00:00:00Z',
    }));
    resetMockExpenses(expenses);

    renderPage();
    await waitFor(() => {
      expect(screen.queryByTestId('expenses-loading')).not.toBeInTheDocument();
    });

    // Should show pagination since totalPages > 1
    await waitFor(() => {
      expect(screen.queryByTestId('btn-next-page')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('btn-next-page'));
    // Page should update — still shows pagination controls
    expect(screen.getByTestId('btn-prev-page')).toBeInTheDocument();
  });

  it('navigates previous page', async () => {
    const expenses = Array.from({ length: 25 }, (_, i) => ({
      id: `exp-pp-${i}`,
      amount: 10.0,
      category: 'OTHER' as const,
      description: `expense ${i}`,
      expenseDate: '2026-05-10',
      createdAt: '2026-05-10T00:00:00Z',
      updatedAt: '2026-05-10T00:00:00Z',
    }));
    resetMockExpenses(expenses);

    renderPage();
    await waitFor(() => {
      expect(screen.queryByTestId('btn-next-page')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByTestId('btn-next-page'));
    await userEvent.click(screen.getByTestId('btn-prev-page'));
    expect(screen.getByTestId('btn-prev-page')).toBeDisabled();
  });

  it('opens category filter and selects a category', async () => {
    renderPage();
    await userEvent.click(screen.getByTestId('category-filter-trigger'));
    const foodItem = screen.getByTestId('filter-food_drink');
    await userEvent.click(foodItem);
    expect(screen.getByTestId('category-filter-trigger')).toHaveTextContent('Food & Drink');
  });

  it('resets to All when All filter selected', async () => {
    renderPage();
    await userEvent.click(screen.getByTestId('category-filter-trigger'));
    await userEvent.click(screen.getByTestId('filter-food_drink'));
    await userEvent.click(screen.getByTestId('category-filter-trigger'));
    await userEvent.click(screen.getByTestId('filter-all'));
    expect(screen.getByTestId('category-filter-trigger')).toHaveTextContent('All');
  });
});
