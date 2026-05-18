import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/lib/i18n';
import {
  ExpenseByMonthChart,
  formatExpenseDollar,
  makeExpenseTooltipFormatter,
} from './ExpenseByMonthChart';
import type { MonthlyExpense } from '../model/types';

const MOCK_DATA: MonthlyExpense[] = [
  { month: '2025-12', total: '0.00' },
  { month: '2026-01', total: '85.00' },
  { month: '2026-02', total: '120.00' },
  { month: '2026-03', total: '95.50' },
  { month: '2026-04', total: '120.00' },
  { month: '2026-05', total: '42.00' },
];

function renderChart(data: MonthlyExpense[]) {
  return render(
    <I18nextProvider i18n={i18n}>
      <ExpenseByMonthChart data={data} />
    </I18nextProvider>,
  );
}

describe('ExpenseByMonthChart', () => {
  it('renders_container', () => {
    renderChart(MOCK_DATA);
    expect(screen.getByTestId('expense-by-month-chart')).toBeInTheDocument();
  });

  it('renders_with_empty_data', () => {
    renderChart([]);
    expect(screen.getByTestId('expense-by-month-chart')).toBeInTheDocument();
  });

  it('renders without crashing with single data point', () => {
    renderChart([{ month: '2026-05', total: '42.00' }]);
    expect(screen.getByTestId('expense-by-month-chart')).toBeInTheDocument();
  });

  it('container has correct test id after rerender', () => {
    const { rerender } = renderChart(MOCK_DATA);
    rerender(
      <I18nextProvider i18n={i18n}>
        <ExpenseByMonthChart data={[]} />
      </I18nextProvider>,
    );
    expect(screen.getByTestId('expense-by-month-chart')).toBeInTheDocument();
  });
});

describe('formatExpenseDollar', () => {
  it('formats_currency_tick', () => {
    expect(formatExpenseDollar(1234)).toBe('$1,234');
  });

  it('formats zero', () => {
    expect(formatExpenseDollar(0)).toBe('$0');
  });

  it('formats large values', () => {
    expect(formatExpenseDollar(1000000)).toBe('$1,000,000');
  });
});

describe('makeExpenseTooltipFormatter', () => {
  it('formats numeric value with dollar sign', () => {
    const formatter = makeExpenseTooltipFormatter('Expenses');
    expect(formatter(42)).toEqual(['$42', 'Expenses']);
  });

  it('falls back to zero for non-numeric values', () => {
    const formatter = makeExpenseTooltipFormatter('Expenses');
    expect(formatter('invalid')).toEqual(['$0', 'Expenses']);
  });

  it('uses the provided label', () => {
    const formatter = makeExpenseTooltipFormatter('Gastos');
    const [, label] = formatter(100);
    expect(label).toBe('Gastos');
  });
});
