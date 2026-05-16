import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/lib/i18n';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { GenerateInvoiceButton } from './GenerateInvoiceButton';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const MOCK_ARTIFACT = {
  format: 'PDF',
  generatedAt: '2026-05-14T10:00:00Z',
  sizeBytes: 12345,
  sha256: 'abc123',
};

beforeEach(() => {
  vi.clearAllMocks();
  server.use(
    http.post('/api/v1/invoices/:id/generate', () =>
      HttpResponse.json(MOCK_ARTIFACT, { status: 201 }),
    ),
  );
});

function renderButton(onGenerated: () => void = vi.fn()) {
  return render(
    <I18nextProvider i18n={i18n}>
      <GenerateInvoiceButton invoiceId="inv-uuid-1" onGenerated={onGenerated} />
    </I18nextProvider>,
  );
}

describe('GenerateInvoiceButton', () => {
  it('renders the generate trigger button', () => {
    renderButton();
    expect(screen.getByTestId('btn-generate-menu')).toBeInTheDocument();
  });

  it('opens dropdown when trigger is clicked', async () => {
    const user = userEvent.setup();
    renderButton();
    await user.click(screen.getByTestId('btn-generate-menu'));
    expect(screen.getByTestId('btn-generate-pdf')).toBeInTheDocument();
    expect(screen.getByTestId('btn-generate-docx')).toBeInTheDocument();
  });

  it('calls generateArtifact with PDF format and shows success toast', async () => {
    const { toast } = await import('sonner');
    const onGenerated = vi.fn();
    const user = userEvent.setup();
    renderButton(onGenerated);
    await user.click(screen.getByTestId('btn-generate-menu'));
    await user.click(screen.getByTestId('btn-generate-pdf'));
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(onGenerated).toHaveBeenCalledOnce();
  });

  it('calls generateArtifact with DOCX format and shows success toast', async () => {
    server.use(
      http.post('/api/v1/invoices/:id/generate', ({ request }) => {
        const url = new URL(request.url);
        const format = url.searchParams.get('format');
        return HttpResponse.json({ ...MOCK_ARTIFACT, format: format ?? 'DOCX' }, { status: 201 });
      }),
    );
    const { toast } = await import('sonner');
    const onGenerated = vi.fn();
    const user = userEvent.setup();
    renderButton(onGenerated);
    await user.click(screen.getByTestId('btn-generate-menu'));
    await user.click(screen.getByTestId('btn-generate-docx'));
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(onGenerated).toHaveBeenCalledOnce();
  });

  it('shows error toast when generation fails', async () => {
    server.use(
      http.post('/api/v1/invoices/:id/generate', () =>
        HttpResponse.json(
          { status: 502, code: 'PDF_CONVERSION_FAILED', detail: 'Conversion failed' },
          { status: 502 },
        ),
      ),
    );
    const { toast } = await import('sonner');
    const onGenerated = vi.fn();
    const user = userEvent.setup();
    renderButton(onGenerated);
    await user.click(screen.getByTestId('btn-generate-menu'));
    await user.click(screen.getByTestId('btn-generate-pdf'));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(onGenerated).not.toHaveBeenCalled();
  });

  it('does not call onGenerated on error', async () => {
    server.use(
      http.post('/api/v1/invoices/:id/generate', () =>
        HttpResponse.json({ status: 409, code: 'ARTIFACT_ALREADY_EXISTS' }, { status: 409 }),
      ),
    );
    const onGenerated = vi.fn();
    const user = userEvent.setup();
    renderButton(onGenerated);
    await user.click(screen.getByTestId('btn-generate-menu'));
    await user.click(screen.getByTestId('btn-generate-docx'));
    await waitFor(() => expect(vi.mocked(toast.error)).toHaveBeenCalled());
    expect(onGenerated).not.toHaveBeenCalled();
  });
});
