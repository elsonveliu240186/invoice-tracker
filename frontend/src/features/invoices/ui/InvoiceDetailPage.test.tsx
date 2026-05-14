import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/lib/i18n';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import { resetMockInvoices } from '@/mocks/handlers';
import { InvoiceDetailPage } from './InvoiceDetailPage';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Mock download functions to avoid DOM/Blob/URL.createObjectURL dependencies
vi.mock('../api/downloadInvoice', () => ({
  downloadInvoiceDocx: vi.fn().mockResolvedValue(undefined),
  downloadInvoicePdf: vi.fn().mockResolvedValue(undefined),
}));

beforeEach(() => {
  resetMockInvoices();
  vi.clearAllMocks();
});

const WAIT_OPTS = { timeout: 5000 };

function renderPage(id = 'inv-uuid-1') {
  return render(
    <MemoryRouter initialEntries={[`/invoices/${id}`]}>
      <I18nextProvider i18n={i18n}>
        <Routes>
          <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
        </Routes>
      </I18nextProvider>
    </MemoryRouter>,
  );
}

describe('InvoiceDetailPage', () => {
  it('shows loading skeleton initially', () => {
    renderPage();
    expect(screen.getByTestId('invoice-detail-loading')).toBeInTheDocument();
  });

  it('renders invoice detail after data loads', async () => {
    renderPage();
    await waitFor(
      () => expect(screen.getByTestId('invoice-detail-page')).toBeInTheDocument(),
      WAIT_OPTS,
    );
    expect(screen.getByTestId('invoice-number')).toBeInTheDocument();
  });

  it('renders the invoice number', async () => {
    renderPage();
    await waitFor(
      () => expect(screen.getByTestId('invoice-detail-page')).toBeInTheDocument(),
      WAIT_OPTS,
    );
    expect(screen.getByTestId('invoice-number').textContent).toContain('INV-2026-0001');
  });

  it('renders invoice lines table', async () => {
    renderPage();
    await waitFor(
      () => expect(screen.getByTestId('invoice-lines-table')).toBeInTheDocument(),
      WAIT_OPTS,
    );
    expect(screen.getAllByTestId('invoice-line-row').length).toBeGreaterThan(0);
  });

  it('renders subtotal and total', async () => {
    renderPage();
    await waitFor(
      () => expect(screen.getByTestId('invoice-subtotal')).toBeInTheDocument(),
      WAIT_OPTS,
    );
    expect(screen.getByTestId('invoice-total')).toBeInTheDocument();
  });

  it('renders action row with View PDF, Download and Send buttons', async () => {
    renderPage();
    await waitFor(
      () => expect(screen.getByTestId('invoice-action-row')).toBeInTheDocument(),
      WAIT_OPTS,
    );
    expect(screen.getByTestId('btn-view-pdf')).toBeInTheDocument();
    expect(screen.getByTestId('btn-download-menu')).toBeInTheDocument();
    expect(screen.getByTestId('btn-send-invoice')).toBeInTheDocument();
  });

  it('does not show sent badge when lastSentAt is null', async () => {
    renderPage();
    await waitFor(
      () => expect(screen.getByTestId('invoice-detail-page')).toBeInTheDocument(),
      WAIT_OPTS,
    );
    expect(screen.queryByTestId('invoice-sent-badge')).not.toBeInTheDocument();
  });

  it('shows sent badge when lastSentAt is non-null', async () => {
    server.use(
      http.get('/api/v1/invoices/:id', () => {
        return HttpResponse.json({
          id: 'inv-uuid-1',
          number: 'INV-2026-0001',
          clientId: '00000000-0000-0000-0000-000000000003',
          clientEmail: 'client@example.com',
          issueDate: '2026-05-13',
          dueDate: '2026-06-12',
          taxRate: '0.21',
          lines: [
            {
              id: '00000000-0000-0000-0000-000000000001',
              description: 'Consulting',
              quantity: 2,
              unitPrice: '50.00',
              lineTotal: '100.00',
            },
          ],
          subtotal: '100.00',
          total: '121.00',
          status: 'SENT',
          lastSentAt: '2026-05-13T20:55:00Z',
          createdAt: '2026-05-13T20:00:00Z',
          updatedAt: '2026-05-13T20:00:00Z',
        });
      }),
    );
    renderPage();
    await waitFor(
      () => expect(screen.getByTestId('invoice-sent-badge')).toBeInTheDocument(),
      WAIT_OPTS,
    );
  });

  it('send button is enabled when invoice has clientEmail', async () => {
    server.use(
      http.get('/api/v1/invoices/:id', () => {
        return HttpResponse.json({
          id: 'inv-uuid-1',
          number: 'INV-2026-0001',
          clientId: '00000000-0000-0000-0000-000000000003',
          clientEmail: 'client@example.com',
          issueDate: '2026-05-13',
          dueDate: '2026-06-12',
          taxRate: '0.21',
          lines: [
            {
              id: '00000000-0000-0000-0000-000000000001',
              description: 'Consulting',
              quantity: 2,
              unitPrice: '50.00',
              lineTotal: '100.00',
            },
          ],
          subtotal: '100.00',
          total: '121.00',
          status: 'DRAFT',
          lastSentAt: null,
          createdAt: '2026-05-13T20:00:00Z',
          updatedAt: '2026-05-13T20:00:00Z',
        });
      }),
    );
    renderPage();
    await waitFor(
      () => expect(screen.getByTestId('btn-send-invoice')).toBeInTheDocument(),
      WAIT_OPTS,
    );
    expect(screen.getByTestId('btn-send-invoice')).not.toBeDisabled();
  });

  it('send button is disabled when invoice has no clientEmail', async () => {
    server.use(
      http.get('/api/v1/invoices/:id', () => {
        return HttpResponse.json({
          id: 'inv-uuid-1',
          number: 'INV-2026-0001',
          clientId: '00000000-0000-0000-0000-000000000003',
          clientEmail: null,
          issueDate: '2026-05-13',
          dueDate: '2026-06-12',
          taxRate: '0.21',
          lines: [
            {
              id: '00000000-0000-0000-0000-000000000001',
              description: 'Consulting',
              quantity: 2,
              unitPrice: '50.00',
              lineTotal: '100.00',
            },
          ],
          subtotal: '100.00',
          total: '121.00',
          status: 'DRAFT',
          lastSentAt: null,
          createdAt: '2026-05-13T20:00:00Z',
          updatedAt: '2026-05-13T20:00:00Z',
        });
      }),
    );
    renderPage();
    await waitFor(
      () => expect(screen.getByTestId('btn-send-invoice')).toBeInTheDocument(),
      WAIT_OPTS,
    );
    expect(screen.getByTestId('btn-send-invoice')).toBeDisabled();
  });

  it('shows not-found state when invoice is not found', async () => {
    renderPage('non-existent-id');
    await waitFor(
      () => expect(screen.getByTestId('invoice-detail-not-found')).toBeInTheDocument(),
      WAIT_OPTS,
    );
  });

  it('shows back link in not-found state', async () => {
    renderPage('non-existent-id');
    await waitFor(
      () => expect(screen.getByTestId('invoice-detail-not-found')).toBeInTheDocument(),
      WAIT_OPTS,
    );
    expect(screen.getByTestId('link-back-to-invoices')).toBeInTheDocument();
  });

  it('send button is enabled when invoice has recipient', async () => {
    renderPage();
    await waitFor(
      () => expect(screen.getByTestId('btn-send-invoice')).toBeInTheDocument(),
      WAIT_OPTS,
    );
    expect(screen.getByTestId('btn-send-invoice')).not.toBeDisabled();
  });

  it('shows StatusBadge in the invoice header', async () => {
    renderPage();
    await waitFor(
      () => expect(screen.getByTestId('invoice-detail-page')).toBeInTheDocument(),
      WAIT_OPTS,
    );
    expect(screen.getByTestId('status-badge')).toBeInTheDocument();
  });

  it('shows MarkAsPaidButton when invoice is not PAID', async () => {
    renderPage();
    await waitFor(
      () => expect(screen.getByTestId('invoice-detail-page')).toBeInTheDocument(),
      WAIT_OPTS,
    );
    // Default mock invoice has status DRAFT
    expect(screen.getByTestId('mark-as-paid-btn')).toBeInTheDocument();
  });

  it('hides MarkAsPaidButton when invoice is PAID', async () => {
    server.use(
      http.get('/api/v1/invoices/:id', () =>
        HttpResponse.json({
          id: 'inv-uuid-1',
          number: 'INV-2026-0001',
          clientId: '00000000-0000-0000-0000-000000000003',
          clientEmail: 'client@example.com',
          issueDate: '2026-05-13',
          dueDate: '2026-06-12',
          taxRate: '0.21',
          lines: [
            {
              id: '00000000-0000-0000-0000-000000000001',
              description: 'Consulting',
              quantity: 2,
              unitPrice: '50.00',
              lineTotal: '100.00',
            },
          ],
          subtotal: '100.00',
          total: '121.00',
          status: 'PAID',
          lastSentAt: null,
          createdAt: '2026-05-13T20:00:00Z',
          updatedAt: '2026-05-13T20:00:00Z',
        }),
      ),
    );
    renderPage();
    await waitFor(
      () => expect(screen.getByTestId('invoice-detail-page')).toBeInTheDocument(),
      WAIT_OPTS,
    );
    expect(screen.queryByTestId('mark-as-paid-btn')).not.toBeInTheDocument();
  });
});
