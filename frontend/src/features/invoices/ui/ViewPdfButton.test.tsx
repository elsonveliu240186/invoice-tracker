import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/lib/i18n';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import { ViewPdfButton } from './ViewPdfButton';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const INVOICE_ID = 'inv-uuid-1';
const INVOICE_NUMBER = 'INV-2026-0001';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let createObjectURLMock: MockInstance<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let revokeObjectURLMock: MockInstance<any>;

beforeEach(() => {
  vi.clearAllMocks();
  createObjectURLMock = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:pdf-test');
  revokeObjectURLMock = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  server.use(
    http.get(
      `/api/v1/invoices/${INVOICE_ID}/pdf`,
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
      <ViewPdfButton invoiceId={INVOICE_ID} invoiceNumber={INVOICE_NUMBER} />
    </I18nextProvider>,
  );
}

describe('ViewPdfButton', () => {
  it('renders the View PDF button', () => {
    renderButton();
    expect(screen.getByTestId('btn-view-pdf')).toBeInTheDocument();
  });

  it('does not show dialog initially', () => {
    renderButton();
    expect(screen.queryByTestId('pdf-dialog')).not.toBeInTheDocument();
  });

  it('opens dialog when button is clicked', async () => {
    const user = userEvent.setup();
    renderButton();
    await user.click(screen.getByTestId('btn-view-pdf'));
    expect(screen.getByTestId('pdf-dialog')).toBeInTheDocument();
  });

  it('fetches PDF via auth-aware httpRaw and shows iframe with blob URL', async () => {
    const user = userEvent.setup();
    renderButton();
    await user.click(screen.getByTestId('btn-view-pdf'));
    await waitFor(() => expect(screen.queryByTestId('pdf-loading')).not.toBeInTheDocument(), {
      timeout: 3000,
    });
    expect(screen.getByTestId('pdf-iframe')).toBeInTheDocument();
    expect(createObjectURLMock).toHaveBeenCalled();
    expect(screen.getByTestId('pdf-iframe')).toHaveAttribute('src', 'blob:pdf-test');
  });

  it('iframe has sandbox attribute set to allow-same-origin', async () => {
    const user = userEvent.setup();
    renderButton();
    await user.click(screen.getByTestId('btn-view-pdf'));
    await waitFor(() => expect(screen.getByTestId('pdf-iframe')).toBeInTheDocument(), {
      timeout: 3000,
    });
    expect(screen.getByTestId('pdf-iframe')).toHaveAttribute('sandbox', 'allow-same-origin');
  });

  it('shows "Open in new tab" link with blob URL after load', async () => {
    const user = userEvent.setup();
    renderButton();
    await user.click(screen.getByTestId('btn-view-pdf'));
    await waitFor(() => expect(screen.getByTestId('link-open-in-new-tab')).toBeInTheDocument(), {
      timeout: 3000,
    });
    expect(screen.getByTestId('link-open-in-new-tab')).toHaveAttribute('href', 'blob:pdf-test');
    expect(screen.getByTestId('link-open-in-new-tab')).toHaveAttribute('target', '_blank');
    expect(screen.getByTestId('link-open-in-new-tab')).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    );
  });

  it('revokes blob URL when dialog is closed', async () => {
    const user = userEvent.setup();
    const { unmount } = renderButton();
    await user.click(screen.getByTestId('btn-view-pdf'));
    await waitFor(() => expect(screen.getByTestId('pdf-iframe')).toBeInTheDocument());
    unmount();
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:pdf-test');
  });

  it('shows error toast and closes on 404', async () => {
    server.use(
      http.get(`/api/v1/invoices/${INVOICE_ID}/pdf`, () =>
        HttpResponse.json(
          { status: 404, code: 'INVOICE_NOT_FOUND', detail: 'Not found' },
          { status: 404 },
        ),
      ),
    );
    const { toast } = await import('sonner');
    const user = userEvent.setup();
    renderButton();
    await user.click(screen.getByTestId('btn-view-pdf'));
    await waitFor(() => expect(toast.error).toHaveBeenCalled(), { timeout: 3000 });
  });
});
