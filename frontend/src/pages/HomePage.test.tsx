import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/lib/i18n';
import { HomePage } from './HomePage';

function renderHomePage() {
  return render(
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>
        <HomePage />
      </I18nextProvider>
    </MemoryRouter>,
  );
}

describe('HomePage', () => {
  it('renders welcome heading', () => {
    renderHomePage();
    expect(
      screen.getByRole('heading', { name: /welcome to invoice tracker/i }),
    ).toBeInTheDocument();
  });

  it('renders the subtitle from i18n', () => {
    renderHomePage();
    expect(screen.getByText(/scaffolded by the agenticai framework/i)).toBeInTheDocument();
  });

  it('has a link to the clients page', () => {
    renderHomePage();
    expect(screen.getByTestId('link-clients')).toBeInTheDocument();
  });

  it('client link text comes from i18n', () => {
    renderHomePage();
    expect(screen.getByText('Manage Clients')).toBeInTheDocument();
  });
});
