import { render, screen, waitFor } from '@testing-library/react';
<<<<<<< HEAD
=======
import userEvent from '@testing-library/user-event';
>>>>>>> feat/FEAT-20260512-03-dashboard-core-ui
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import { http, HttpResponse } from 'msw';
<<<<<<< HEAD
import i18n from '@/shared/lib/i18n';
import { server } from '@/mocks/server';
import { useAuthStore } from '@/features/auth/model/useAuthStore';
import { DashboardPage } from './DashboardPage';

=======
import { server } from '@/mocks/server';
import { resetMockClients } from '@/mocks/handlers';
import i18n from '@/shared/lib/i18n';
import { DashboardPage } from './DashboardPage';

beforeEach(() => {
  resetMockClients();
});

>>>>>>> feat/FEAT-20260512-03-dashboard-core-ui
function renderDashboard() {
  return render(
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>
        <DashboardPage />
      </I18nextProvider>
    </MemoryRouter>,
  );
}

<<<<<<< HEAD
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
=======
describe('DashboardPage', () => {
  it('shows skeletons while loading then renders kpi values', async () => {
    renderDashboard();
    // Skeletons should appear initially
    expect(screen.getAllByTestId('kpi-skeleton').length).toBeGreaterThan(0);
    // After data loads, values appear
    await waitFor(() => {
      expect(screen.queryAllByTestId('kpi-skeleton')).toHaveLength(0);
    });
    const values = screen.getAllByTestId('kpi-value');
    // totalElements = 2 from resetMockClients (but size=1 in query, so totalElements still 2)
    expect(values.length).toBeGreaterThan(0);
  });

  it('renders kpi values from api (2 clients → total=2, active=2, invoices=0)', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.queryAllByTestId('kpi-skeleton')).toHaveLength(0);
    });
    const values = screen.getAllByTestId('kpi-value');
    // totalClients and activeClients both show 2; invoices shows 0
    const texts = values.map((el) => el.textContent);
    expect(texts).toContain('2');
    expect(texts).toContain('0');
  });

  it('shows error state with retry button when api returns 500', async () => {
    server.use(
      http.get('/api/v1/clients', () =>
        HttpResponse.json({ status: 500, detail: 'Server error' }, { status: 500 }),
      ),
    );
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-error')).toBeInTheDocument();
    });
    expect(screen.getByTestId('btn-retry')).toBeInTheDocument();
  });

  it('retries when retry button is clicked', async () => {
    const user = userEvent.setup();
    let callCount = 0;
    server.use(
      http.get('/api/v1/clients', () => {
        callCount++;
        if (callCount === 1) {
          return HttpResponse.json({ status: 500, detail: 'Server error' }, { status: 500 });
        }
        return HttpResponse.json({
          content: [],
          page: 0,
          size: 1,
          totalElements: 3,
          totalPages: 1,
        });
      }),
    );
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByTestId('btn-retry')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('btn-retry'));
    await waitFor(() => {
      expect(screen.queryByTestId('dashboard-error')).not.toBeInTheDocument();
    });
  });

  it('renders the recent activity section', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByTestId('recent-activity')).toBeInTheDocument();
    });
  });

  it('renders the dashboard heading', () => {
    renderDashboard();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
>>>>>>> feat/FEAT-20260512-03-dashboard-core-ui
  });
});
