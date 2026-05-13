import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { resetMockClients } from '@/mocks/handlers';
import i18n from '@/shared/lib/i18n';
import { DashboardPage } from './DashboardPage';

beforeEach(() => {
  resetMockClients();
});

function renderDashboard() {
  return render(
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>
        <DashboardPage />
      </I18nextProvider>
    </MemoryRouter>,
  );
}

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
  });
});
