import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router';
import { HomePage } from './HomePage';

function renderHomePage() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );
}

describe('HomePage', () => {
  it('renders welcome heading', () => {
    renderHomePage();
    expect(screen.getByRole('heading', { name: /welcome/i })).toBeInTheDocument();
  });

  it('mentions the /new-feature command', () => {
    renderHomePage();
    expect(screen.getByText(/new-feature/)).toBeInTheDocument();
  });

  it('has a link to the clients page', () => {
    renderHomePage();
    expect(screen.getByTestId('link-clients')).toBeInTheDocument();
  });
});
