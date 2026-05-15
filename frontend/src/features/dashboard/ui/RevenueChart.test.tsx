import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RevenueChart, formatMonth, formatDollar } from './RevenueChart';

const SAMPLE_DATA = [
  { month: '2026-01', revenue: 3200 },
  { month: '2026-02', revenue: 4100 },
  { month: '2026-03', revenue: 5800 },
];

describe('RevenueChart', () => {
  it('renders the chart container', () => {
    render(<RevenueChart data={SAMPLE_DATA} />);
    expect(screen.getByTestId('revenue-chart')).toBeInTheDocument();
  });

  it('renders with empty data without crashing', () => {
    render(<RevenueChart data={[]} />);
    expect(screen.getByTestId('revenue-chart')).toBeInTheDocument();
  });
});

describe('formatMonth', () => {
  it('converts YYYY-MM to short month name', () => {
    expect(formatMonth('2026-01')).toMatch(/jan/i);
  });

  it('returns the raw string when format is invalid', () => {
    expect(formatMonth('invalid')).toBe('invalid');
  });

  it('converts month 12 correctly', () => {
    expect(formatMonth('2026-12')).toMatch(/dec/i);
  });
});

describe('formatDollar', () => {
  it('prefixes value with dollar sign', () => {
    expect(formatDollar(1000)).toContain('$');
  });

  it('formats zero correctly', () => {
    expect(formatDollar(0)).toBe('$0');
  });
});
