import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('shows user email in banner when user has email but no displayName', () => {
    useAuthStore.setState({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
      user: { email: 'john@example.com', displayName: undefined as any, provider: 'google' },
      status: 'authenticated',
      error: null,
    });
    renderDashboard();
    expect(screen.getByText(/welcome back, john@example.com/i)).toBeInTheDocument();
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

  // ── New tests for FEAT-20260517-01 ────────────────────────────────────────

  it('renders_expense_by_month_chart_after_load', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.queryByTestId('expense-loading')).not.toBeInTheDocument());
    expect(screen.getByTestId('expense-by-month-chart')).toBeInTheDocument();
  });

  it('renders_expense_by_category_chart_after_load', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.queryByTestId('expense-loading')).not.toBeInTheDocument());
    expect(screen.getByTestId('expense-by-category-chart')).toBeInTheDocument();
  });

  it('expense_endpoint_failure_shows_inline_alert_but_keeps_invoice_charts', async () => {
    server.use(
      http.get('/api/v1/dashboard/expense-stats', () =>
        HttpResponse.json({ status: 500, detail: 'Server Error' }, { status: 500 }),
      ),
    );
    renderDashboard();
    await waitFor(() => expect(screen.queryByTestId('dashboard-loading')).not.toBeInTheDocument());
    // Invoice charts still show
    expect(screen.getByTestId('revenue-chart')).toBeInTheDocument();
    // Expense error alert is present
    await waitFor(() => expect(screen.getByTestId('expense-error')).toBeInTheDocument());
    expect(screen.getByTestId('expense-error')).toBeInTheDocument();
  });

  it('renders_i18n_chart_headings_after_load', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.queryByTestId('expense-loading')).not.toBeInTheDocument());
    expect(screen.getByText('Expense by Month')).toBeInTheDocument();
    expect(screen.getByText('Expense by Category')).toBeInTheDocument();
  });

  it('renders_date_filter_control', () => {
    renderDashboard();
    expect(screen.getByTestId('dashboard-date-filter')).toBeInTheDocument();
  });

  it('applying_filter_re_fetches_with_new_params', async () => {
    const capturedUrls: string[] = [];
    server.use(
      http.get('/api/v1/dashboard/expense-stats', ({ request }) => {
        capturedUrls.push(request.url);
        return HttpResponse.json({
          from: '2026-01-01',
          to: '2026-05-31',
          grandTotal: '200.00',
          expenseByMonth: [
            { month: '2026-01', total: '50.00' },
            { month: '2026-02', total: '50.00' },
            { month: '2026-03', total: '50.00' },
            { month: '2026-04', total: '50.00' },
          ],
          expenseByCategory: [{ category: 'OTHER', total: '200.00', count: 4 }],
        });
      }),
      http.get('/api/v1/dashboard/stats', ({ request }) => {
        capturedUrls.push(request.url);
        return HttpResponse.json({
          totalInvoices: 12,
          draftCount: 4,
          sentCount: 5,
          paidCount: 3,
          totalRevenue: 24500,
          paidRevenue: 8200,
          pendingRevenue: 16300,
          revenueByMonth: [],
        });
      }),
    );

    const user = userEvent.setup();
    renderDashboard();
    await waitFor(() => expect(screen.queryByTestId('expense-loading')).not.toBeInTheDocument());

    // Open date filter
    await user.click(screen.getByTestId('dashboard-date-filter'));
    await waitFor(() => expect(screen.getByTestId('date-filter-from')).toBeInTheDocument());

    await user.type(screen.getByTestId('date-filter-from'), '2026-01-01');
    await user.type(screen.getByTestId('date-filter-to'), '2026-05-31');
    await user.click(screen.getByTestId('date-filter-apply'));

    await waitFor(() => {
      const filtered = capturedUrls.filter((u) => u.includes('from='));
      expect(filtered.length).toBeGreaterThan(0);
    });
  });
});
