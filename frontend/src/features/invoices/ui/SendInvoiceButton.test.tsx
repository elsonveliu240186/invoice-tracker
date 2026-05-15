import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/lib/i18n';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import { resetMockInvoices } from '@/mocks/handlers';
import { SendInvoiceButton } from './SendInvoiceButton';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

beforeEach(() => {
  resetMockInvoices();
  vi.clearAllMocks();
});

function renderWithI18n(ui: React.ReactElement) {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);
}

describe('SendInvoiceButton', () => {
  it('renders the send button', () => {
    renderWithI18n(<SendInvoiceButton invoiceId="inv-uuid-1" hasRecipient={true} />);
    expect(screen.getByTestId('btn-send-invoice')).toBeInTheDocument();
  });

  it('is disabled when hasRecipient is false', () => {
    renderWithI18n(<SendInvoiceButton invoiceId="inv-uuid-1" hasRecipient={false} />);
    expect(screen.getByTestId('btn-send-invoice')).toBeDisabled();
  });

  it('is enabled when hasRecipient is true', () => {
    renderWithI18n(<SendInvoiceButton invoiceId="inv-uuid-1" hasRecipient={true} />);
    expect(screen.getByTestId('btn-send-invoice')).not.toBeDisabled();
  });

  it('opens confirm dialog when button is clicked', async () => {
    const user = userEvent.setup();
    renderWithI18n(<SendInvoiceButton invoiceId="inv-uuid-1" hasRecipient={true} />);
    await user.click(screen.getByTestId('btn-send-invoice'));
    expect(screen.getByTestId('send-confirm-dialog')).toBeInTheDocument();
  });

  it('closes dialog on cancel', async () => {
    const user = userEvent.setup();
    renderWithI18n(<SendInvoiceButton invoiceId="inv-uuid-1" hasRecipient={true} />);
    await user.click(screen.getByTestId('btn-send-invoice'));
    expect(screen.getByTestId('send-confirm-dialog')).toBeInTheDocument();
    await user.click(screen.getByTestId('btn-confirm-cancel'));
    expect(screen.queryByTestId('send-confirm-dialog')).not.toBeInTheDocument();
  });

  it('fires success toast after confirm and calls onSent', async () => {
    const { toast } = await import('sonner');
    const onSent = vi.fn();
    const user = userEvent.setup();
    renderWithI18n(
      <SendInvoiceButton invoiceId="inv-uuid-1" hasRecipient={true} onSent={onSent} />,
    );
    await user.click(screen.getByTestId('btn-send-invoice'));
    await user.click(screen.getByTestId('btn-confirm-send'));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Invoice sent successfully');
    });
    expect(onSent).toHaveBeenCalledOnce();
  });

  it('fires error toast when send fails (502)', async () => {
    server.use(
      http.post('/api/v1/invoices/:id/send-email', () => {
        return HttpResponse.json(
          { status: 502, code: 'EMAIL_DELIVERY_FAILED', detail: 'SMTP failed' },
          { status: 502 },
        );
      }),
    );

    const { toast } = await import('sonner');
    const user = userEvent.setup();
    renderWithI18n(<SendInvoiceButton invoiceId="inv-uuid-1" hasRecipient={true} />);
    await user.click(screen.getByTestId('btn-send-invoice'));
    await user.click(screen.getByTestId('btn-confirm-send'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to send invoice');
    });
  });
});
