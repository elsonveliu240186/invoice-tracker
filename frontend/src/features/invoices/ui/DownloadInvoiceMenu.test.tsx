import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/lib/i18n';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import { resetMockInvoices } from '@/mocks/handlers';
import type { InvoiceArtifactsMetadata } from '../model/artifact';
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

const MOCK_METADATA = {
  pdf: {
    format: 'PDF' as const,
    generatedAt: '2026-05-14T10:00:00Z',
    sizeBytes: 12345,
    sha256: 'abc',
  },
  docx: {
    format: 'DOCX' as const,
    generatedAt: '2026-05-14T10:00:00Z',
    sizeBytes: 9876,
    sha256: 'def',
  },
};

function renderMenu(metadata: InvoiceArtifactsMetadata | null = null) {
  return render(
    <I18nextProvider i18n={i18n}>
      <DownloadInvoiceMenu
        invoiceId="inv-uuid-1"
        invoiceNumber="INV-2026-0001"
        metadata={metadata}
        onRegenerated={vi.fn()}
      />
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

  it('shows regenerate PDF and DOCX buttons when saved artifacts exist', async () => {
    const user = userEvent.setup();
    renderMenu(MOCK_METADATA);
    await user.click(screen.getByTestId('btn-download-menu'));
    expect(screen.getByTestId('btn-regenerate-pdf')).toBeInTheDocument();
    expect(screen.getByTestId('btn-regenerate-docx')).toBeInTheDocument();
  });

  it('calls generateArtifact with overwrite=true when regenerate PDF is clicked', async () => {
    server.use(
      http.post('/api/v1/invoices/:id/generate', () =>
        HttpResponse.json(
          { format: 'PDF', generatedAt: '2026-05-14T10:00:00Z', sizeBytes: 12345, sha256: 'abc' },
          { status: 201 },
        ),
      ),
    );
    const { toast } = await import('sonner');
    const user = userEvent.setup();
    renderMenu(MOCK_METADATA);
    await user.click(screen.getByTestId('btn-download-menu'));
    await user.click(screen.getByTestId('btn-regenerate-pdf'));
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });

  it('shows error toast when regenerate DOCX fails', async () => {
    server.use(
      http.post('/api/v1/invoices/:id/generate', () =>
        HttpResponse.json({ status: 502, code: 'PDF_CONVERSION_FAILED' }, { status: 502 }),
      ),
    );
    const { toast } = await import('sonner');
    const user = userEvent.setup();
    renderMenu(MOCK_METADATA);
    await user.click(screen.getByTestId('btn-download-menu'));
    await user.click(screen.getByTestId('btn-regenerate-docx'));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });
});
