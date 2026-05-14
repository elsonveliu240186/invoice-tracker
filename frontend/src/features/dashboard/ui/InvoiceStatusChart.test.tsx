import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { InvoiceStatusChart, labelPercent } from './InvoiceStatusChart';

describe('InvoiceStatusChart', () => {
  it('renders the chart container', () => {
    render(<InvoiceStatusChart draftCount={4} sentCount={5} paidCount={3} />);
    expect(screen.getByTestId('invoice-status-chart')).toBeInTheDocument();
  });

  it('renders with all-zero counts without crashing', () => {
    render(<InvoiceStatusChart draftCount={0} sentCount={0} paidCount={0} />);
    expect(screen.getByTestId('invoice-status-chart')).toBeInTheDocument();
  });

  it('renders with only paid invoices without crashing', () => {
    render(<InvoiceStatusChart draftCount={0} sentCount={0} paidCount={10} />);
    expect(screen.getByTestId('invoice-status-chart')).toBeInTheDocument();
  });
});

describe('labelPercent', () => {
  it('returns empty string when total is zero', () => {
    expect(labelPercent(0, 0)).toBe('');
  });

  it('returns 50% when value is half of total', () => {
    expect(labelPercent(5, 10)).toBe('50%');
  });

  it('rounds to nearest integer percent', () => {
    expect(labelPercent(1, 3)).toBe('33%');
  });

  it('returns 100% when value equals total', () => {
    expect(labelPercent(12, 12)).toBe('100%');
  });
});
