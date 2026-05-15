import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatCard } from './StatCard';

describe('StatCard', () => {
  it('renders label and value', () => {
    render(<StatCard label="Total Invoices" value="12" />);
    expect(screen.getByText('Total Invoices')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('renders optional subtitle when provided', () => {
    render(<StatCard label="Paid" value="3" sub="$8,200.00" />);
    expect(screen.getByText('$8,200.00')).toBeInTheDocument();
  });

  it('does not render subtitle element when sub is omitted', () => {
    render(<StatCard label="Paid" value="3" />);
    expect(screen.queryByText('$8,200.00')).not.toBeInTheDocument();
  });

  it('renders with amber accent class using color token', () => {
    render(<StatCard label="Revenue" value="$24,500" accent="amber" />);
    const card = screen.getByTestId('stat-card');
    expect(card.className).toContain('border-l-[var(--color-accent)]');
  });

  it('renders with green accent class using status-paid token', () => {
    render(<StatCard label="Paid" value="3" accent="green" />);
    const card = screen.getByTestId('stat-card');
    expect(card.className).toContain('border-l-[var(--color-status-paid-fg)]');
  });

  it('renders with blue accent class using status-sent token', () => {
    render(<StatCard label="Pending" value="5" accent="blue" />);
    const card = screen.getByTestId('stat-card');
    expect(card.className).toContain('border-l-[var(--color-status-sent-fg)]');
  });

  it('renders with no border class for default accent', () => {
    render(<StatCard label="Total" value="12" accent="default" />);
    const card = screen.getByTestId('stat-card');
    expect(card.className).not.toContain('border-l-4');
  });

  it('renders without crashing for an unknown accent value (fallback branch)', () => {
    // Cast to bypass TS — exercises the `?? ''` fallback in ACCENT_BORDER lookup
    render(<StatCard label="X" value="1" accent={'unknown' as 'default'} />);
    const card = screen.getByTestId('stat-card');
    expect(card).toBeInTheDocument();
  });
});
