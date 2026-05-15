import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ClientStatusBadge } from './ClientStatusBadge';

describe('ClientStatusBadge', () => {
  it('renders Active badge for ACTIVE status', () => {
    render(<ClientStatusBadge status="ACTIVE" />);
    expect(screen.getByTestId('status-badge-active')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders Inactive badge for INACTIVE status', () => {
    render(<ClientStatusBadge status="INACTIVE" />);
    expect(screen.getByTestId('status-badge-inactive')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });
});
