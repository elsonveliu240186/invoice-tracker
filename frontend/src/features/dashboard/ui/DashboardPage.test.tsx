import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import { http, HttpResponse } from 'msw';
import i18n from '@/shared/lib/i18n';
import { server } from '@/mocks/server';
import { useAuthStore } from '@/features/auth/model/useAuthStore';
import { DashboardPage } from './DashboardPage';

function renderDashboard() {
  return render(
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>
        <DashboardPage />
      </I18nextProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useAuthStore.setState({ user: null, status: 'unauthenticated', error: null });
});

describe('DashboardPage', () => {
  it('renders the welcome banner', () => {
    renderDashboard();
    expect(screen.getByTestId('welcome-banner')).toBeInTheDocument();
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
  });

  it('shows "there" in banner when no user is logged in', () => {
    renderDashboard();
    expect(screen.getByText(/welcome back, there/i)).toBeInTheDocument();
  });

  it('shows user display name in banner when logged in', () => {
    useAuthStore.setState({
      user: {
        email: 'john@example.com',
        displayName: 'John Doe',
        provider: 'password',
        basicAuthToken: 'dGVzdA==',
      },
      status: 'authenticated',
      error: null,
    });
    renderDashboard();
    expect(screen.getByText(/welcome back, John Doe/i)).toBeInTheDocument();
  });

  it('shows loading state while fetching', () => {
    renderDashboard();
    expect(screen.getByTestId('dashboard-loading')).toBeInTheDocument();
  });

  it('renders 4 stat cards after successful load', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.queryByTestId('dashboard-loading')).not.toBeInTheDocument());
    const cards = screen.getAllByTestId('stat-card');
    expect(cards).toHaveLength(4);
  });

  it('renders the revenue chart after load', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.queryByTestId('dashboard-loading')).not.toBeInTheDocument());
    expect(screen.getByTestId('revenue-chart')).toBeInTheDocument();
  });

  it('renders the invoice status chart after load', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.queryByTestId('dashboard-loading')).not.toBeInTheDocument());
    expect(screen.getByTestId('invoice-status-chart')).toBeInTheDocument();
  });

  it('renders stat-cards grid container after load', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.queryByTestId('dashboard-loading')).not.toBeInTheDocument());
    expect(screen.getByTestId('stat-cards')).toBeInTheDocument();
  });

  it('shows error message on API failure', async () => {
    server.use(
      http.get('/api/v1/dashboard/stats', () =>
        HttpResponse.json({ status: 500, detail: 'Internal Server Error' }, { status: 500 }),
      ),
    );
    renderDashboard();
    await waitFor(() => expect(screen.queryByTestId('dashboard-loading')).not.toBeInTheDocument());
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('does not show stat cards on error', async () => {
    server.use(
      http.get('/api/v1/dashboard/stats', () =>
        HttpResponse.json({ status: 500, detail: 'Server Error' }, { status: 500 }),
      ),
    );
    renderDashboard();
    await waitFor(() => expect(screen.queryByTestId('dashboard-loading')).not.toBeInTheDocument());
    expect(screen.queryByTestId('stat-cards')).not.toBeInTheDocument();
  });

  it('welcome banner className contains var(--color-sidebar-bg)', () => {
    renderDashboard();
    const banner = screen.getByTestId('welcome-banner');
    expect(banner.className).toContain('--color-sidebar-bg');
  });

  it('renders i18n keys for stat card labels after load', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.queryByTestId('dashboard-loading')).not.toBeInTheDocument());
    expect(screen.getByText('Total Invoices')).toBeInTheDocument();
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('Paid Invoices')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders i18n chart section headings after load', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.queryByTestId('dashboard-loading')).not.toBeInTheDocument());
    expect(screen.getByText('Revenue by Month')).toBeInTheDocument();
    expect(screen.getByText('Invoice Status')).toBeInTheDocument();
  });
});
