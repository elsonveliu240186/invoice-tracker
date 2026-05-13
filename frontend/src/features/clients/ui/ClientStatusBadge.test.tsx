import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ClientStatusBadge } from './ClientStatusBadge';

describe('ClientStatusBadge', () => {
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
  });
});
