import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { HomePage } from './HomePage';

describe('HomePage', () => {
  it('renders welcome heading', () => {
    render(<HomePage />);
    expect(screen.getByRole('heading', { name: /welcome/i })).toBeInTheDocument();
  });

  it('mentions the /new-feature command', () => {
    render(<HomePage />);
    expect(screen.getByText(/new-feature/)).toBeInTheDocument();
  });
});
