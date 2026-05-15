import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import { http, HttpResponse } from 'msw';
import i18n from '@/shared/lib/i18n';
import { server } from '@/mocks/server';
import { resetMockInvoices } from '@/mocks/handlers';
import { MarkAsPaidButton } from './MarkAsPaidButton';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function renderButton(
  props: { invoiceId?: string; status?: 'DRAFT' | 'SENT' | 'PAID'; onPaid?: () => void } = {},
) {
  const { invoiceId = 'inv-uuid-1', status = 'DRAFT', onPaid } = props;
  return render(
    <I18nextProvider i18n={i18n}>
      {onPaid !== undefined ? (
        <MarkAsPaidButton invoiceId={invoiceId} status={status} onPaid={onPaid} />
      ) : (
        <MarkAsPaidButton invoiceId={invoiceId} status={status} />
      )}
    </I18nextProvider>,
  );
}

beforeEach(() => {
  resetMockInvoices();
  vi.clearAllMocks();
});

describe('MarkAsPaidButton', () => {
  it('renders for DRAFT status', () => {
    renderButton({ status: 'DRAFT' });
    expect(screen.getByTestId('mark-as-paid-btn')).toBeInTheDocument();
  });

  it('renders for SENT status', () => {
    renderButton({ status: 'SENT' });
    expect(screen.getByTestId('mark-as-paid-btn')).toBeInTheDocument();
  });

  it('returns null (hidden) when status is PAID', () => {
    renderButton({ status: 'PAID' });
    expect(screen.queryByTestId('mark-as-paid-btn')).not.toBeInTheDocument();
  });

  it('calls onPaid and shows success toast on successful click', async () => {
    const { toast } = await import('sonner');
    const onPaid = vi.fn();
    const user = userEvent.setup();
    renderButton({ status: 'DRAFT', onPaid });

    await user.click(screen.getByTestId('mark-as-paid-btn'));

    await waitFor(() => {
      expect(onPaid).toHaveBeenCalledTimes(1);
    });
    expect(toast.success).toHaveBeenCalledWith('Invoice marked as paid.');
  });

  it('shows error toast on failed API call', async () => {
    const { toast } = await import('sonner');
    server.use(
      http.patch('/api/v1/invoices/:id/mark-paid', () =>
        HttpResponse.json(
          { status: 404, detail: 'Invoice not found', code: 'INVOICE_NOT_FOUND' },
          { status: 404 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderButton({ status: 'DRAFT' });

    await user.click(screen.getByTestId('mark-as-paid-btn'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Could not mark invoice as paid.');
    });
  });

  it('does not call onPaid when API call fails', async () => {
    server.use(
      http.patch('/api/v1/invoices/:id/mark-paid', () =>
        HttpResponse.json({ status: 500, detail: 'Server error' }, { status: 500 }),
      ),
    );
    const onPaid = vi.fn();
    const user = userEvent.setup();
    renderButton({ status: 'SENT', onPaid });

    await user.click(screen.getByTestId('mark-as-paid-btn'));

    await waitFor(() => {
      expect(onPaid).not.toHaveBeenCalled();
    });
  });
});
