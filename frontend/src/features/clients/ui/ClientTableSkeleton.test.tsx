import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ClientTableSkeleton } from './ClientTableSkeleton';

describe('ClientTableSkeleton', () => {
  it('renders 5 skeleton rows', () => {
    render(<ClientTableSkeleton />);
    expect(screen.getAllByTestId('skeleton-row')).toHaveLength(5);
  });

  it('renders the skeleton container', () => {
    render(<ClientTableSkeleton />);
    expect(screen.getByTestId('clients-table-skeleton')).toBeInTheDocument();
  });

  it('each row has role presentation', () => {
    render(<ClientTableSkeleton />);
    const rows = screen.getAllByRole('presentation');
    expect(rows.length).toBeGreaterThanOrEqual(5);
  });
});
