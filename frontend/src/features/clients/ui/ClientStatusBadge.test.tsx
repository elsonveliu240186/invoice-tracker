import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ClientStatusBadge } from './ClientStatusBadge';

describe('ClientStatusBadge', () => {
<<<<<<< HEAD
  it('renders Active badge for ACTIVE status', () => {
    render(<ClientStatusBadge status="ACTIVE" />);
    expect(screen.getByTestId('status-badge-active')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders Inactive badge for INACTIVE status', () => {
    render(<ClientStatusBadge status="INACTIVE" />);
    expect(screen.getByTestId('status-badge-inactive')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
=======
  it('renders ACTIVE badge with success variant', () => {
    render(<ClientStatusBadge status="ACTIVE" />);
    const badge = screen.getByTestId('status-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('data-variant', 'success');
    expect(badge).toHaveTextContent('Active');
  });

  it('renders INACTIVE badge with muted variant', () => {
    render(<ClientStatusBadge status="INACTIVE" />);
    const badge = screen.getByTestId('status-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('data-variant', 'muted');
    expect(badge).toHaveTextContent('Inactive');
>>>>>>> feat/FEAT-20260512-03-dashboard-core-ui
  });
});
