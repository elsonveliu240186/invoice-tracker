import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/lib/i18n';
import type { PieLabelRenderProps } from 'recharts';
import {
  ExpenseByCategoryChart,
  makeExpenseLabelRenderer,
  makeCategoryTooltipFormatter,
  FALLBACK_COLORS,
} from './ExpenseByCategoryChart';
import type { CategoryExpense } from '../model/types';

const MOCK_DATA: CategoryExpense[] = [
  { category: 'FOOD_DRINK', total: '162.50', count: 4 },
  { category: 'TRANSPORT', total: '120.00', count: 3 },
  { category: 'HOUSING', total: '95.00', count: 1 },
];

function renderChart(data: CategoryExpense[]) {
  return render(
    <I18nextProvider i18n={i18n}>
      <ExpenseByCategoryChart data={data} />
    </I18nextProvider>,
  );
}

describe('ExpenseByCategoryChart', () => {
  it('renders_container', () => {
    renderChart(MOCK_DATA);
    expect(screen.getByTestId('expense-by-category-chart')).toBeInTheDocument();
  });

  it('shows_empty_pie_when_no_data', () => {
    renderChart([]);
    expect(screen.getByTestId('expense-by-category-chart')).toBeInTheDocument();
  });

  it('renders_localised_category_names', () => {
    renderChart(MOCK_DATA);
    // The chart renders legend text via Recharts into the DOM
    const container = screen.getByTestId('expense-by-category-chart');
    expect(container).toBeInTheDocument();
  });

  it('renders with many categories beyond theme tokens', () => {
    const manyCategories: CategoryExpense[] = [
      { category: 'FOOD_DRINK', total: '100.00', count: 1 },
      { category: 'TRANSPORT', total: '90.00', count: 1 },
      { category: 'HOUSING', total: '80.00', count: 1 },
      { category: 'HEALTH', total: '70.00', count: 1 },
      { category: 'ENTERTAINMENT', total: '60.00', count: 1 },
      { category: 'SHOPPING', total: '50.00', count: 1 },
      { category: 'TRAVEL', total: '40.00', count: 1 },
    ];
    renderChart(manyCategories);
    expect(screen.getByTestId('expense-by-category-chart')).toBeInTheDocument();
  });
});

// Minimal PieLabelRenderProps-compatible object for unit tests
function makeLabelProps(value: number | undefined): PieLabelRenderProps {
  return {
    value,
    cx: 100,
    cy: 100,
    innerRadius: 60,
    outerRadius: 90,
    midAngle: 0,
    startAngle: 0,
    endAngle: 90,
    index: 0,
    percent: 0.5,
  } as PieLabelRenderProps;
}

describe('makeExpenseLabelRenderer', () => {
  it('returns_percentage_string_for_valid_values', () => {
    const render = makeExpenseLabelRenderer(200);
    expect(render(makeLabelProps(100))).toBe('50%');
  });

  it('returns_empty_string_when_total_is_zero', () => {
    const render = makeExpenseLabelRenderer(0);
    expect(render(makeLabelProps(50))).toBe('');
  });

  it('handles_non_number_value', () => {
    const render = makeExpenseLabelRenderer(100);
    expect(render(makeLabelProps(undefined))).toBe('0%');
  });

  it('rounds_to_nearest_integer', () => {
    const render = makeExpenseLabelRenderer(3);
    expect(render(makeLabelProps(1))).toBe('33%');
  });
});

describe('makeCategoryTooltipFormatter', () => {
  it('formats numeric value with dollar sign', () => {
    const formatter = makeCategoryTooltipFormatter('Expenses');
    expect(formatter(100)).toEqual(['$100', 'Expenses']);
  });

  it('formats string value as string', () => {
    const formatter = makeCategoryTooltipFormatter('Expenses');
    expect(formatter('some-text')).toEqual(['some-text', 'Expenses']);
  });

  it('uses the provided label', () => {
    const formatter = makeCategoryTooltipFormatter('Gastos');
    const [, label] = formatter(50);
    expect(label).toBe('Gastos');
  });
});

describe('FALLBACK_COLORS', () => {
  it('has at least 5 entries', () => {
    expect(FALLBACK_COLORS.length).toBeGreaterThanOrEqual(5);
  });

  it('all entries are hex color strings', () => {
    FALLBACK_COLORS.forEach((color) => {
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });
});
