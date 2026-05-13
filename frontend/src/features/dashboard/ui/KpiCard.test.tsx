import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { KpiCard } from './KpiCard';

describe('KpiCard', () => {
  it('renders the title', () => {
    render(<KpiCard title="Total clients" value={42} />);
    expect(screen.getByText('Total clients')).toBeInTheDocument();
  });

  it('renders the value', () => {
    render(<KpiCard title="Total clients" value={1234} />);
    expect(screen.getByTestId('kpi-value')).toHaveTextContent('1,234');
  });

  it('renders em-dash for null value', () => {
    render(<KpiCard title="Invoices" value={null} />);
    expect(screen.getByTestId('kpi-value')).toHaveTextContent('—');
  });

  it('renders skeleton when loading=true', () => {
    render(<KpiCard title="Total clients" loading />);
    expect(screen.getByTestId('kpi-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('kpi-value')).not.toBeInTheDocument();
  });

  it('renders value when loading=false', () => {
    render(<KpiCard title="Total clients" value={5} loading={false} />);
    expect(screen.getByTestId('kpi-value')).toBeInTheDocument();
    expect(screen.queryByTestId('kpi-skeleton')).not.toBeInTheDocument();
  });

  it('renders zero value correctly', () => {
    render(<KpiCard title="Invoices" value={0} />);
    expect(screen.getByTestId('kpi-value')).toHaveTextContent('0');
  });
});
