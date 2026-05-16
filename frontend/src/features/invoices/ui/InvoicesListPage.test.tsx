import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import { http, HttpResponse } from 'msw';
import i18n from '@/shared/lib/i18n';
import { server } from '@/mocks/server';
import { resetMockInvoices } from '@/mocks/handlers';
import { InvoicesListPage } from './InvoicesListPage';
import type { InvoicePage } from '../model/types';

function renderPage() {
  return render(
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>
        <InvoicesListPage />
      </I18nextProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  resetMockInvoices();
});

describe('InvoicesListPage', () => {
  it('shows loading skeleton initially', () => {
    renderPage();
    expect(screen.getByTestId('invoices-loading')).toBeInTheDocument();
  });

  it('renders the invoice table after load', async () => {
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('invoices-loading')).not.toBeInTheDocument());
    expect(screen.getByTestId('invoices-table')).toBeInTheDocument();
  });

  it('renders an invoice row with invoice number link', async () => {
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('invoices-loading')).not.toBeInTheDocument());
    expect(screen.getByText('INV-2026-0001')).toBeInTheDocument();
  });

  it('renders the Status column header', async () => {
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('invoices-loading')).not.toBeInTheDocument());
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders a status badge in each row', async () => {
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('invoices-loading')).not.toBeInTheDocument());
    expect(screen.getByTestId('status-badge')).toBeInTheDocument();
  });

  it('shows DRAFT badge for a draft invoice', async () => {
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('invoices-loading')).not.toBeInTheDocument());
    expect(screen.getByTestId('status-badge')).toHaveTextContent('Draft');
  });

  it('shows empty state when no invoices exist', async () => {
    resetMockInvoices([]);
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('invoices-loading')).not.toBeInTheDocument());
    expect(screen.getByTestId('invoices-empty')).toBeInTheDocument();
  });

  it('shows error alert on API failure', async () => {
    server.use(
      http.get('/api/v1/invoices', () =>
        HttpResponse.json({ status: 500, detail: 'Server error' }, { status: 500 }),
      ),
    );
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('invoices-loading')).not.toBeInTheDocument());
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('shows pagination controls when totalPages > 1', async () => {
    const multiPage: InvoicePage = {
      content: [
        {
          id: 'inv-1',
          number: 'INV-001',
          clientId: 'c1',
          clientEmail: null,
          issueDate: '2026-01-01',
          dueDate: '2026-02-01',
          taxRate: '0',
          lines: [],
          subtotal: '100',
          total: '100',
          status: 'PAID',
          lastSentAt: null,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      ],
      page: 0,
      size: 1,
      totalElements: 2,
      totalPages: 2,
    };
    server.use(http.get('/api/v1/invoices', () => HttpResponse.json(multiPage)));
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('invoices-loading')).not.toBeInTheDocument());
    expect(screen.getByTestId('btn-prev-page')).toBeInTheDocument();
    expect(screen.getByTestId('btn-next-page')).toBeInTheDocument();
  });

  it('prev page button is disabled on the first page', async () => {
    const multiPage: InvoicePage = {
      content: [
        {
          id: 'inv-1',
          number: 'INV-001',
          clientId: 'c1',
          clientEmail: null,
          issueDate: '2026-01-01',
          dueDate: '2026-02-01',
          taxRate: '0',
          lines: [],
          subtotal: '100',
          total: '100',
          status: 'SENT',
          lastSentAt: null,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      ],
      page: 0,
      size: 1,
      totalElements: 2,
      totalPages: 2,
    };
    server.use(http.get('/api/v1/invoices', () => HttpResponse.json(multiPage)));
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('invoices-loading')).not.toBeInTheDocument());
    expect(screen.getByTestId('btn-prev-page')).toBeDisabled();
  });

  it('clicking next page navigates forward', async () => {
    const page0: InvoicePage = {
      content: [
        {
          id: 'inv-1',
          number: 'INV-001',
          clientId: 'c1',
          clientEmail: null,
          issueDate: '2026-01-01',
          dueDate: '2026-02-01',
          taxRate: '0',
          lines: [],
          subtotal: '100',
          total: '100',
          status: 'DRAFT',
          lastSentAt: null,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      ],
      page: 0,
      size: 1,
      totalElements: 2,
      totalPages: 2,
    };
    const page1: InvoicePage = {
      content: [
        {
          id: 'inv-2',
          number: 'INV-002',
          clientId: 'c1',
          clientEmail: null,
          issueDate: '2026-01-02',
          dueDate: '2026-02-02',
          taxRate: '0',
          lines: [],
          subtotal: '200',
          total: '200',
          status: 'PAID',
          lastSentAt: null,
          createdAt: '2026-01-02T00:00:00Z',
          updatedAt: '2026-01-02T00:00:00Z',
        },
      ],
      page: 1,
      size: 1,
      totalElements: 2,
      totalPages: 2,
    };
    let callCount = 0;
    server.use(
      http.get('/api/v1/invoices', () => {
        callCount++;
        return HttpResponse.json(callCount === 1 ? page0 : page1);
      }),
    );

    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('invoices-loading')).not.toBeInTheDocument());
    await user.click(screen.getByTestId('btn-next-page'));
    await waitFor(() => expect(screen.getByText('INV-002')).toBeInTheDocument());
  });

  it('renders manage template link', async () => {
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('invoices-loading')).not.toBeInTheDocument());
    expect(screen.getByTestId('link-manage-template')).toBeInTheDocument();
  });

  it('clicking prev page navigates back after going forward', async () => {
    const page0: InvoicePage = {
      content: [
        {
          id: 'inv-1',
          number: 'INV-001',
          clientId: 'c1',
          clientEmail: null,
          issueDate: '2026-01-01',
          dueDate: '2026-02-01',
          taxRate: '0',
          lines: [],
          subtotal: '100',
          total: '100',
          status: 'DRAFT',
          lastSentAt: null,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      ],
      page: 0,
      size: 1,
      totalElements: 2,
      totalPages: 2,
    };
    const page1: InvoicePage = {
      content: [
        {
          id: 'inv-2',
          number: 'INV-002',
          clientId: 'c1',
          clientEmail: null,
          issueDate: '2026-01-02',
          dueDate: '2026-02-02',
          taxRate: '0',
          lines: [],
          subtotal: '200',
          total: '200',
          status: 'PAID',
          lastSentAt: null,
          createdAt: '2026-01-02T00:00:00Z',
          updatedAt: '2026-01-02T00:00:00Z',
        },
      ],
      page: 1,
      size: 1,
      totalElements: 2,
      totalPages: 2,
    };
    let callCount = 0;
    server.use(
      http.get('/api/v1/invoices', () => {
        callCount++;
        return HttpResponse.json(callCount <= 1 ? page0 : callCount === 2 ? page1 : page0);
      }),
    );

    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('invoices-loading')).not.toBeInTheDocument());
    await user.click(screen.getByTestId('btn-next-page'));
    await waitFor(() => expect(screen.getByText('INV-002')).toBeInTheDocument());
    await user.click(screen.getByTestId('btn-prev-page'));
    await waitFor(() => expect(screen.getByText('INV-001')).toBeInTheDocument());
  });
});
