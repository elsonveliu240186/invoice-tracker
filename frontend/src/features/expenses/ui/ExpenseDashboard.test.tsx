import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExpenseDashboard } from './ExpenseDashboard';
import type { ExpenseSummary } from '../model/types';

const MOCK_SUMMARY: ExpenseSummary = {
  month: '2026-05',
  grandTotal: 1234.56,
  totalCount: 5,
  byCategory: [
    { category: 'FOOD_DRINK', total: 320.0, count: 3 },
    { category: 'TRANSPORT', total: 914.56, count: 2 },
  ],
};

const EMPTY_SUMMARY: ExpenseSummary = {
  month: '2026-05',
  grandTotal: 0,
  totalCount: 0,
  byCategory: [],
};

describe('ExpenseDashboard', () => {
  it('renders the grand total formatted as $1,234.56', () => {
    render(
      <ExpenseDashboard
        summary={MOCK_SUMMARY}
        loading={false}
        selectedMonth="2026-05"
        onMonthChange={vi.fn()}
      />,
    );
    expect(screen.getByTestId('grand-total').textContent).toBe('$1,234.56');
  });

  it('renders category cards for each category in summary', () => {
    render(
      <ExpenseDashboard
        summary={MOCK_SUMMARY}
        loading={false}
        selectedMonth="2026-05"
        onMonthChange={vi.fn()}
      />,
    );
    expect(screen.getByTestId('category-card-FOOD_DRINK')).toBeInTheDocument();
    expect(screen.getByTestId('category-card-TRANSPORT')).toBeInTheDocument();
  });

  it('shows empty state when byCategory is empty', () => {
    render(
      <ExpenseDashboard
        summary={EMPTY_SUMMARY}
        loading={false}
        selectedMonth="2026-05"
        onMonthChange={vi.fn()}
      />,
    );
    expect(screen.getByTestId('dashboard-empty')).toBeInTheDocument();
  });

  it('shows loading skeleton instead of grand total while loading', () => {
    render(
      <ExpenseDashboard
        summary={null}
        loading={true}
        selectedMonth="2026-05"
        onMonthChange={vi.fn()}
      />,
    );
    expect(screen.queryByTestId('grand-total')).not.toBeInTheDocument();
  });

  it('calls onMonthChange when month picker changes', () => {
    const onMonthChange = vi.fn();
    render(
      <ExpenseDashboard
        summary={MOCK_SUMMARY}
        loading={false}
        selectedMonth="2026-05"
        onMonthChange={onMonthChange}
      />,
    );
    const picker = screen.getByTestId('month-picker');
    fireEvent.change(picker, { target: { value: '2026-04' } });
    expect(onMonthChange).toHaveBeenCalledWith('2026-04');
  });

  it('renders the month picker with the selected month value', () => {
    render(
      <ExpenseDashboard
        summary={null}
        loading={false}
        selectedMonth="2026-03"
        onMonthChange={vi.fn()}
      />,
    );
    const picker = screen.getByTestId('month-picker');
    expect((picker as HTMLInputElement).value).toBe('2026-03');
  });

  it('renders count text for each category card', () => {
    render(
      <ExpenseDashboard
        summary={MOCK_SUMMARY}
        loading={false}
        selectedMonth="2026-05"
        onMonthChange={vi.fn()}
      />,
    );
    expect(screen.getByText('3 expenses')).toBeInTheDocument();
    expect(screen.getByText('2 expenses')).toBeInTheDocument();
  });

  it('renders singular "expense" for count 1', () => {
    const singleSummary: ExpenseSummary = {
      month: '2026-05',
      grandTotal: 10,
      totalCount: 1,
      byCategory: [{ category: 'OTHER', total: 10, count: 1 }],
    };
    render(
      <ExpenseDashboard
        summary={singleSummary}
        loading={false}
        selectedMonth="2026-05"
        onMonthChange={vi.fn()}
      />,
    );
    expect(screen.getByText('1 expense')).toBeInTheDocument();
  });
});
