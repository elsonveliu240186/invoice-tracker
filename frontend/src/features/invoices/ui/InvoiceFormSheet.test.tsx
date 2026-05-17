import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/lib/i18n';
import { resetMockClients } from '@/mocks/handlers';
import { InvoiceFormSheet } from './InvoiceFormSheet';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

beforeEach(() => {
  resetMockClients();
  vi.clearAllMocks();
});

function renderSheet(props: Partial<React.ComponentProps<typeof InvoiceFormSheet>> = {}) {
  const onClose = vi.fn();
  const onSubmit = vi.fn().mockResolvedValue(undefined);

  render(
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>
        <InvoiceFormSheet
          open={true}
          onClose={onClose}
          onSubmit={onSubmit}
          editingInvoice={null}
          {...props}
        />
      </I18nextProvider>
    </MemoryRouter>,
  );

  return { onClose, onSubmit };
}

const WAIT = { timeout: 3000 };

describe('InvoiceFormSheet', () => {
  it('renders nothing when open is false', () => {
    renderSheet({ open: false });
    expect(screen.queryByTestId('invoice-form-sheet')).not.toBeInTheDocument();
  });

  it('renders the sheet panel when open is true', () => {
    renderSheet();
    expect(screen.getByTestId('invoice-form-sheet')).toBeInTheDocument();
  });

  it('renders the backdrop', () => {
    renderSheet();
    expect(screen.getByTestId('sheet-backdrop')).toBeInTheDocument();
  });

  it('shows "New Invoice" title when editingInvoice is null', async () => {
    renderSheet();
    await waitFor(() => expect(screen.getByText(/new invoice/i)).toBeInTheDocument(), WAIT);
  });

  it('shows "Edit Invoice" title when editingInvoice is provided', async () => {
    const invoice = {
      id: 'inv-1',
      number: 'INV-2026-0001',
      clientId: 'uuid-1',
      clientEmail: null,
      issueDate: '2026-05-15',
      dueDate: '2026-06-15',
      taxRate: '0.21',
      lines: [
        {
          id: 'l1',
          description: 'Service',
          quantity: 1,
          unitPrice: '100.00',
          lineTotal: '100.00',
        },
      ],
      subtotal: '100.00',
      total: '121.00',
      status: 'DRAFT' as const,
      lastSentAt: null,
      createdAt: '2026-05-15T00:00:00Z',
      updatedAt: '2026-05-15T00:00:00Z',
    };
    renderSheet({ editingInvoice: invoice });
    await waitFor(() => expect(screen.getByText(/edit invoice/i)).toBeInTheDocument(), WAIT);
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const { onClose } = renderSheet();
    await user.click(screen.getByTestId('sheet-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const { onClose } = renderSheet();
    await user.click(screen.getByTestId('sheet-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders the invoice form inside the sheet', () => {
    renderSheet();
    expect(screen.getByTestId('invoice-form')).toBeInTheDocument();
  });

  it('shows the next number placeholder when provided', () => {
    renderSheet({ nextNumber: 'INV-2026-0005' });
    const input = screen.getByTestId('input-number');
    expect((input as HTMLInputElement).placeholder).toBe('INV-2026-0005');
  });
});
