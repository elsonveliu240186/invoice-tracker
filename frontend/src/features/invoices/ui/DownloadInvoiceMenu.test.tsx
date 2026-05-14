import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/lib/i18n';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import { resetMockInvoices } from '@/mocks/handlers';
import { DownloadInvoiceMenu } from './DownloadInvoiceMenu';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Mock the download functions so tests don't depend on DOM/Blob/URL.createObjectURL
vi.mock('../api/downloadInvoice', () => ({
  downloadInvoiceDocx: vi.fn().mockResolvedValue(undefined),
  downloadInvoicePdf: vi.fn().mockResolvedValue(undefined),
}));

beforeEach(async () => {
  resetMockInvoices();
  vi.clearAllMocks();
  // Re-set default mock implementations after clearAllMocks
  const { downloadInvoiceDocx, downloadInvoicePdf } = await import('../api/downloadInvoice');
  vi.mocked(downloadInvoiceDocx).mockResolvedValue(undefined);
  vi.mocked(downloadInvoicePdf).mockResolvedValue(undefined);
});

function renderMenu() {
  return render(
    <I18nextProvider i18n={i18n}>
      <DownloadInvoiceMenu invoiceId="inv-uuid-1" invoiceNumber="INV-2026-0001" />
    </I18nextProvider>,
  );
}

describe('DownloadInvoiceMenu', () => {
  it('renders the download trigger button', () => {
    renderMenu();
    expect(screen.getByTestId('btn-download-menu')).toBeInTheDocument();
  });

  it('opens menu when trigger is clicked', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByTestId('btn-download-menu'));
    expect(screen.getByTestId('btn-download-docx')).toBeInTheDocument();
    expect(screen.getByTestId('btn-download-pdf')).toBeInTheDocument();
  });

  it('calls downloadInvoiceDocx when DOCX item is selected', async () => {
    const { downloadInvoiceDocx } = await import('../api/downloadInvoice');
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByTestId('btn-download-menu'));
    await user.click(screen.getByTestId('btn-download-docx'));
    await waitFor(() =>
      expect(downloadInvoiceDocx).toHaveBeenCalledWith('inv-uuid-1', 'INV-2026-0001'),
    );
  });

  it('calls downloadInvoicePdf when PDF item is selected', async () => {
    const { downloadInvoicePdf } = await import('../api/downloadInvoice');
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByTestId('btn-download-menu'));
    await user.click(screen.getByTestId('btn-download-pdf'));
    await waitFor(() =>
      expect(downloadInvoicePdf).toHaveBeenCalledWith('inv-uuid-1', 'INV-2026-0001'),
    );
  });

  it('shows error toast when DOCX download fails', async () => {
    const { downloadInvoiceDocx } = await import('../api/downloadInvoice');
    vi.mocked(downloadInvoiceDocx).mockRejectedValueOnce(new Error('Network error'));
    server.use(
      http.get('/api/v1/invoices/:id/docx', () =>
        HttpResponse.json({ status: 500, detail: 'Server error' }, { status: 500 }),
      ),
    );
    const { toast } = await import('sonner');
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByTestId('btn-download-menu'));
    await user.click(screen.getByTestId('btn-download-docx'));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });

  it('shows error toast when PDF download fails', async () => {
    const { downloadInvoicePdf } = await import('../api/downloadInvoice');
    vi.mocked(downloadInvoicePdf).mockRejectedValueOnce(new Error('Conversion failed'));
    server.use(
      http.get('/api/v1/invoices/:id/pdf', () =>
        HttpResponse.json({ status: 502, detail: 'Conversion failed' }, { status: 502 }),
      ),
    );
    const { toast } = await import('sonner');
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByTestId('btn-download-menu'));
    await user.click(screen.getByTestId('btn-download-pdf'));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });
});
