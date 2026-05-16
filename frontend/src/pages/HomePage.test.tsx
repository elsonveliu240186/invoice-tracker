import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/lib/i18n';
import { useAuthStore } from '@/features/auth/model/useAuthStore';
import { HomePage } from './HomePage';

beforeEach(() => {
  useAuthStore.setState({ user: null, status: 'unauthenticated', error: null });
});

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
  it('renders the dashboard page container', () => {
    renderHomePage();
    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
  });

  it('renders the welcome banner', () => {
    renderHomePage();
    expect(screen.getByTestId('welcome-banner')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    renderHomePage();
    expect(screen.getByTestId('dashboard-loading')).toBeInTheDocument();
  });

  it('renders stat cards after data loads', async () => {
    renderHomePage();
    await waitFor(() => expect(screen.queryByTestId('dashboard-loading')).not.toBeInTheDocument());
    expect(screen.getAllByTestId('stat-card')).toHaveLength(4);
  });
});
