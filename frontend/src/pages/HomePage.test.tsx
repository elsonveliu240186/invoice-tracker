import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/lib/i18n';
<<<<<<< HEAD
import { useAuthStore } from '@/features/auth/model/useAuthStore';
import { HomePage } from './HomePage';

beforeEach(() => {
  useAuthStore.setState({ user: null, status: 'unauthenticated', error: null });
=======
import { resetMockClients } from '@/mocks/handlers';
import { HomePage } from './HomePage';

beforeEach(() => {
  resetMockClients();
>>>>>>> feat/FEAT-20260512-03-dashboard-core-ui
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

<<<<<<< HEAD
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
=======
describe('HomePage (DashboardPage)', () => {
  it('renders the dashboard heading', () => {
    renderHomePage();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders KPI cards', () => {
    renderHomePage();
    expect(screen.getAllByTestId('kpi-card').length).toBeGreaterThan(0);
  });

  it('renders recent activity section', async () => {
    renderHomePage();
    await waitFor(() => {
      expect(screen.getByTestId('recent-activity')).toBeInTheDocument();
    });
  });

  it('renders the dashboard page root element with data-testid="home-page"', async () => {
    renderHomePage();
    await waitFor(() => {
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
    });
  });

  it('shows kpi values after loading', async () => {
    renderHomePage();
    await waitFor(() => {
      expect(screen.queryAllByTestId('kpi-skeleton')).toHaveLength(0);
    });
    expect(screen.getAllByTestId('kpi-value').length).toBeGreaterThan(0);
>>>>>>> feat/FEAT-20260512-03-dashboard-core-ui
  });
});
