import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/lib/i18n';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import { resetMockTemplateMetadata } from '@/mocks/handlers';
import { InvoiceTemplateSettingsPage } from './InvoiceTemplateSettingsPage';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  resetMockTemplateMetadata();
  vi.clearAllMocks();
});

const WAIT = { timeout: 5000 };

function renderPage() {
  return render(
    <I18nextProvider i18n={i18n}>
      <InvoiceTemplateSettingsPage />
    </I18nextProvider>,
  );
}

function makeDocxFile(name = 'template.docx', sizeBytes = 1024): File {
  return new File([new Uint8Array(sizeBytes)], name, {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

describe('InvoiceTemplateSettingsPage', () => {
  it('renders the page', () => {
    renderPage();
    expect(screen.getByTestId('invoice-template-settings-page')).toBeInTheDocument();
  });

  it('shows loading skeleton initially', () => {
    renderPage();
    expect(screen.getByTestId('template-metadata-loading')).toBeInTheDocument();
  });

  it('renders template metadata after load', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByTestId('template-metadata')).toBeInTheDocument(), WAIT);
    expect(screen.getByTestId('template-filename').textContent).toBe('invoice-template.docx');
  });

  it('shows default-template warning when isDefault=true', async () => {
    renderPage();
    await waitFor(
      () => expect(screen.getByTestId('default-template-warning')).toBeInTheDocument(),
      WAIT,
    );
  });

  it('does not show default-template warning when isDefault=false', async () => {
    server.use(
      http.get('/api/v1/settings/invoice-template/preview', () =>
        HttpResponse.json({
          filename: 'custom.docx',
          size: 5000,
          uploadedAt: '2026-05-13T20:10:00Z',
          isDefault: false,
        }),
      ),
    );
    renderPage();
    await waitFor(() => expect(screen.getByTestId('template-metadata')).toBeInTheDocument(), WAIT);
    expect(screen.queryByTestId('default-template-warning')).not.toBeInTheDocument();
  });

  it('download link points to correct URL', async () => {
    renderPage();
    await waitFor(
      () => expect(screen.getByTestId('link-download-current')).toBeInTheDocument(),
      WAIT,
    );
    expect(screen.getByTestId('link-download-current')).toHaveAttribute(
      'href',
      '/api/v1/settings/invoice-template/download',
    );
  });

  it('refreshes metadata after successful upload', async () => {
    server.use(
      http.get('/api/v1/settings/invoice-template/preview', () =>
        HttpResponse.json({
          filename: 'invoice-template.docx',
          size: 8192,
          uploadedAt: '2026-01-01T00:00:00Z',
          isDefault: true,
        }),
      ),
    );
    renderPage();
    await waitFor(() => expect(screen.getByTestId('template-metadata')).toBeInTheDocument(), WAIT);

    // Override for post-upload refetch
    server.use(
      http.get('/api/v1/settings/invoice-template/preview', () =>
        HttpResponse.json({
          filename: 'invoice-template.docx',
          size: 9999,
          uploadedAt: '2026-06-01T00:00:00Z',
          isDefault: false,
        }),
      ),
    );

    const user = userEvent.setup();
    const input = screen.getByTestId('template-file-input');
    await user.upload(input, makeDocxFile());
    await user.click(screen.getByTestId('btn-upload-template'));

    await waitFor(
      () => expect(screen.queryByTestId('default-template-warning')).not.toBeInTheDocument(),
      WAIT,
    );
  });

  it('renders the upload form', async () => {
    renderPage();
    await waitFor(
      () => expect(screen.getByTestId('template-upload-form')).toBeInTheDocument(),
      WAIT,
    );
  });
});
