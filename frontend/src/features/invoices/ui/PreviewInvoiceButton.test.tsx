import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/lib/i18n';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import { PreviewInvoiceButton } from './PreviewInvoiceButton';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('../api/downloadInvoice', () => ({
  downloadInvoicePdf: vi.fn().mockResolvedValue(undefined),
  downloadInvoiceDocx: vi.fn().mockResolvedValue(undefined),
}));

const INVOICE_ID = 'inv-uuid-1';
const INVOICE_NUMBER = 'INV-2026-0001';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let createObjectURLMock: MockInstance<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let revokeObjectURLMock: MockInstance<any>;

beforeEach(() => {
  vi.clearAllMocks();
  createObjectURLMock = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview-test');
  revokeObjectURLMock = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  server.use(
    http.get(
      `/api/v1/invoices/${INVOICE_ID}/preview-pdf`,
      () =>
        new HttpResponse('%PDF-1.4\n' + '0'.repeat(100), {
          headers: { 'Content-Type': 'application/pdf' },
        }),
    ),
  );
});

afterEach(() => {
  createObjectURLMock.mockRestore();
  revokeObjectURLMock.mockRestore();
});

function renderButton() {
  return render(
    <I18nextProvider i18n={i18n}>
      <PreviewInvoiceButton invoiceId={INVOICE_ID} invoiceNumber={INVOICE_NUMBER} />
    </I18nextProvider>,
  );
}

describe('PreviewInvoiceButton', () => {
  it('renders the preview button', () => {
    renderButton();
    expect(screen.getByTestId('btn-preview-invoice')).toBeInTheDocument();
  });

  it('opens dialog when button is clicked', async () => {
    const user = userEvent.setup();
    renderButton();
    await user.click(screen.getByTestId('btn-preview-invoice'));
    expect(screen.getByTestId('preview-dialog')).toBeInTheDocument();
  });

  it('calls getPreviewPdfBlobUrl and shows iframe after load', async () => {
    const user = userEvent.setup();
    renderButton();
    await user.click(screen.getByTestId('btn-preview-invoice'));
    await waitFor(() => expect(screen.queryByTestId('preview-loading')).not.toBeInTheDocument(), {
      timeout: 3000,
    });
    expect(screen.getByTestId('preview-iframe')).toBeInTheDocument();
    expect(createObjectURLMock).toHaveBeenCalled();
  });

  it('shows open-in-new-tab link after blob loads', async () => {
    const user = userEvent.setup();
    renderButton();
    await user.click(screen.getByTestId('btn-preview-invoice'));
    await waitFor(
      () => expect(screen.getByTestId('link-preview-open-new-tab')).toBeInTheDocument(),
      {
        timeout: 3000,
      },
    );
  });

  it('revokes blob URL when dialog is closed', async () => {
    const user = userEvent.setup();
    const { unmount } = renderButton();
    await user.click(screen.getByTestId('btn-preview-invoice'));
    await waitFor(() => expect(screen.getByTestId('preview-iframe')).toBeInTheDocument());
    unmount();
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:preview-test');
  });

  it('shows error toast and closes on 404', async () => {
    server.use(
      http.get(`/api/v1/invoices/${INVOICE_ID}/preview-pdf`, () =>
        HttpResponse.json(
          { status: 404, code: 'INVOICE_NOT_FOUND', detail: 'Not found' },
          { status: 404 },
        ),
      ),
    );
    const { toast } = await import('sonner');
    const user = userEvent.setup();
    renderButton();
    await user.click(screen.getByTestId('btn-preview-invoice'));
    await waitFor(() => expect(toast.error).toHaveBeenCalled(), { timeout: 3000 });
  });

  it('renders download PDF and DOCX buttons inside dialog', async () => {
    const user = userEvent.setup();
    renderButton();
    await user.click(screen.getByTestId('btn-preview-invoice'));
    expect(screen.getByTestId('btn-preview-download-pdf')).toBeInTheDocument();
    expect(screen.getByTestId('btn-preview-download-docx')).toBeInTheDocument();
  });

  it('revokes blob URL and closes when dialog X button is clicked', async () => {
    const user = userEvent.setup();
    renderButton();
    await user.click(screen.getByTestId('btn-preview-invoice'));
    await waitFor(() => expect(screen.getByTestId('preview-iframe')).toBeInTheDocument(), {
      timeout: 3000,
    });
    // Close via Escape key (fires Radix Dialog onOpenChange(false))
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByTestId('preview-dialog')).not.toBeInTheDocument(), {
      timeout: 3000,
    });
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:preview-test');
  });
});
