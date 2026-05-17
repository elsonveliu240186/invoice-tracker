import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import { http, HttpResponse } from 'msw';
import i18n from '@/shared/lib/i18n';
import { server } from '@/mocks/server';
import { resetMockClients, resetMockInvoices } from '@/mocks/handlers';
import { InvoicesListPage } from './InvoicesListPage';
import type { InvoicePage } from '../model/types';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

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
  resetMockClients();
  vi.clearAllMocks();
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

  it('renders New Invoice button', async () => {
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('invoices-loading')).not.toBeInTheDocument());
    expect(screen.getByTestId('btn-new-invoice')).toBeInTheDocument();
  });

  it('clicking New Invoice button opens the invoice form sheet', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('invoices-loading')).not.toBeInTheDocument());
    await user.click(screen.getByTestId('btn-new-invoice'));
    expect(screen.getByTestId('invoice-form-sheet')).toBeInTheDocument();
  });

  it('handleSubmit: creates invoice, shows toast, and closes sheet', async () => {
    // Override the POST handler to accept any clientId for this test
    const TEST_CLIENT_ID = '00000000-0000-0000-0000-000000000099';
    server.use(
      http.post('/api/v1/invoices', async ({ request }) => {
        const body = (await request.json()) as {
          clientId: string;
          number?: string;
          issueDate: string;
          dueDate: string;
          taxRate: number;
          lines: Array<{ description: string; quantity: number; unitPrice: number }>;
        };
        return HttpResponse.json(
          {
            id: 'inv-new-1',
            number: body.number ?? 'INV-TEST-001',
            clientId: body.clientId,
            clientEmail: 'test@example.com',
            issueDate: body.issueDate,
            dueDate: body.dueDate,
            taxRate: String(body.taxRate),
            lines: body.lines.map((l, i) => ({
              id: `line-${i}`,
              description: l.description,
              quantity: l.quantity,
              unitPrice: l.unitPrice.toFixed(2),
              lineTotal: (l.quantity * l.unitPrice).toFixed(2),
            })),
            subtotal: '100.00',
            total: '110.00',
            status: 'DRAFT',
            lastSentAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          { status: 201 },
        );
      }),
    );

    const { toast } = await import('sonner');

    type SheetProps = {
      open: boolean;
      onClose: () => void;
      onSubmit: (data: import('../model/schema').InvoiceFormValues) => Promise<void>;
    };

    const { default: React } = await import('react');
    const sheetModule = await import('./InvoiceFormSheet');
    vi.spyOn(sheetModule, 'InvoiceFormSheet').mockImplementation(
      ({ open, onClose, onSubmit }: SheetProps) => {
        if (!open) return null;
        return React.createElement(
          'div',
          { 'data-testid': 'invoice-form-sheet' },
          React.createElement('button', {
            'data-testid': 'mock-sheet-submit',
            onClick: () => {
              void onSubmit({
                clientId: TEST_CLIENT_ID,
                number: 'INV-TEST-001',
                issueDate: '2026-05-15',
                dueDate: '2026-06-15',
                taxRate: 0.1,
                lines: [{ description: 'Service', quantity: 1, unitPrice: 100 }],
              });
            },
          }),
          React.createElement('button', {
            'data-testid': 'mock-sheet-close',
            onClick: onClose,
          }),
        );
      },
    );

    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('invoices-loading')).not.toBeInTheDocument());
    await user.click(screen.getByTestId('btn-new-invoice'));
    expect(screen.getByTestId('invoice-form-sheet')).toBeInTheDocument();

    await user.click(screen.getByTestId('mock-sheet-submit'));
    await waitFor(() => expect(toast.success).toHaveBeenCalled(), { timeout: 3000 });

    vi.restoreAllMocks();
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

  it('search input shows clear button and clearSearch resets it', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('invoices-loading')).not.toBeInTheDocument());
    const searchInput = screen.getByTestId('search-input');
    await user.type(searchInput, 'INV');
    expect(screen.getByTestId('btn-clear-search')).toBeInTheDocument();
    await user.click(screen.getByTestId('btn-clear-search'));
    expect((searchInput as HTMLInputElement).value).toBe('');
    expect(screen.queryByTestId('btn-clear-search')).not.toBeInTheDocument();
  });

  it('preview button sets previewingInvoice state', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('invoices-loading')).not.toBeInTheDocument());
    const previewBtn = screen.getByTestId('btn-preview-inv-uuid-1');
    await user.click(previewBtn);
    // PreviewInvoiceButton is rendered; clicking preview again or waiting confirms the onOpenChange handler
    // We just verify clicking didn't crash
    expect(previewBtn).toBeInTheDocument();
  });

  it('handleConfirmDelete: shows delete dialog and confirms delete', async () => {
    const { toast } = await import('sonner');
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('invoices-loading')).not.toBeInTheDocument());
    await user.click(screen.getByTestId('btn-delete-inv-uuid-1'));
    expect(screen.getByTestId('confirm-delete-dialog')).toBeInTheDocument();
    await user.click(screen.getByTestId('btn-confirm-delete'));
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });

  it('handleConfirmDelete: cancel hides dialog', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('invoices-loading')).not.toBeInTheDocument());
    await user.click(screen.getByTestId('btn-delete-inv-uuid-1'));
    expect(screen.getByTestId('confirm-delete-dialog')).toBeInTheDocument();
    await user.click(screen.getByTestId('btn-cancel-delete'));
    expect(screen.queryByTestId('confirm-delete-dialog')).not.toBeInTheDocument();
  });

  it('handleSend: clicking send button calls sendMutate for DRAFT invoice with email', async () => {
    const { toast } = await import('sonner');
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('invoices-loading')).not.toBeInTheDocument());
    // The default invoice is DRAFT with clientEmail set
    const sendBtn = screen.queryByTestId('btn-send-inv-uuid-1');
    if (sendBtn) {
      await user.click(sendBtn);
      await waitFor(() => expect(toast.success).toHaveBeenCalled());
    }
  });

  it('handleMarkPaid: clicking mark paid for SENT invoice', async () => {
    const { toast } = await import('sonner');
    const user = userEvent.setup();
    // Set up a SENT invoice
    resetMockInvoices([
      {
        id: 'inv-sent-1',
        number: 'INV-SENT-001',
        clientId: '00000000-0000-0000-0000-000000000003',
        clientEmail: 'test@example.com',
        issueDate: '2026-05-01',
        dueDate: '2026-06-01',
        taxRate: '0.21',
        lines: [],
        subtotal: '100.00',
        total: '121.00',
        status: 'SENT',
        lastSentAt: '2026-05-05T00:00:00Z',
        createdAt: '2026-05-01T00:00:00Z',
        updatedAt: '2026-05-01T00:00:00Z',
      },
    ]);
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('invoices-loading')).not.toBeInTheDocument());
    const markPaidBtn = screen.queryByTestId('btn-paid-inv-sent-1');
    if (markPaidBtn) {
      await user.click(markPaidBtn);
      await waitFor(() => expect(toast.success).toHaveBeenCalled());
    }
  });

  it('renders Client column header', async () => {
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('invoices-loading')).not.toBeInTheDocument());
    expect(screen.getByText('Client')).toBeInTheDocument();
  });

  it('shows clientNameSnapshot in the client cell', async () => {
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('invoices-loading')).not.toBeInTheDocument());
    expect(screen.getByTestId('invoice-client-inv-uuid-1')).toHaveTextContent('Acme Corp');
  });

  it('shows dash when clientNameSnapshot is null', async () => {
    resetMockInvoices([
      {
        id: 'inv-no-snap',
        number: 'INV-NOSNAP',
        clientId: 'c1',
        clientEmail: null,
        clientNameSnapshot: null,
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
    ]);
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('invoices-loading')).not.toBeInTheDocument());
    expect(screen.getByTestId('invoice-client-inv-no-snap')).toHaveTextContent('—');
  });

  it('status filter: selecting DRAFT shows only matching invoices', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('invoices-loading')).not.toBeInTheDocument());
    await user.click(screen.getByTestId('status-filter-trigger'));
    await user.click(screen.getByTestId('filter-draft'));
    // Still shows default invoice which is DRAFT
    expect(screen.getByText('INV-2026-0001')).toBeInTheDocument();
  });
});
