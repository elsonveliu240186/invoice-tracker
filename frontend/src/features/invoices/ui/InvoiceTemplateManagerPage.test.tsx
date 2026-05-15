import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/lib/i18n';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import { resetMockTemplateMetadata } from '@/mocks/handlers';
import { InvoiceTemplateManagerPage } from './InvoiceTemplateManagerPage';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  resetMockTemplateMetadata();
  vi.clearAllMocks();
});

function renderPage() {
  return render(
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>
        <InvoiceTemplateManagerPage />
      </I18nextProvider>
    </MemoryRouter>,
  );
}

describe('InvoiceTemplateManagerPage', () => {
  it('renders the page', () => {
    renderPage();
    expect(screen.getByTestId('invoice-template-manager-page')).toBeInTheDocument();
  });

  it('shows loading skeleton initially', () => {
    renderPage();
    expect(screen.getByTestId('template-metadata-loading')).toBeInTheDocument();
  });

  it('renders template metadata after load', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByTestId('template-metadata')).toBeInTheDocument(), {
      timeout: 3000,
    });
    expect(screen.getByTestId('template-filename')).toBeInTheDocument();
  });

  it('shows default template warning when isDefault is true', async () => {
    renderPage();
    await waitFor(
      () => expect(screen.getByTestId('default-template-warning')).toBeInTheDocument(),
      {
        timeout: 3000,
      },
    );
  });

  it('does not show warning when template is not default', async () => {
    server.use(
      http.get('/api/v1/settings/invoice-template/preview', () =>
        HttpResponse.json({
          filename: 'custom.docx',
          size: 1024,
          uploadedAt: '2026-05-01T00:00:00Z',
          isDefault: false,
        }),
      ),
    );
    renderPage();
    await waitFor(() => expect(screen.getByTestId('template-metadata')).toBeInTheDocument(), {
      timeout: 3000,
    });
    expect(screen.queryByTestId('default-template-warning')).not.toBeInTheDocument();
  });

  it('renders upload form', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByTestId('template-upload-form')).toBeInTheDocument(), {
      timeout: 3000,
    });
  });

  it('renders placeholder reference card', async () => {
    renderPage();
    await waitFor(
      () => expect(screen.getByTestId('placeholder-reference-card')).toBeInTheDocument(),
      { timeout: 3000 },
    );
  });

  it('renders back-to-invoices link', () => {
    renderPage();
    expect(screen.getByTestId('link-back-to-invoices')).toBeInTheDocument();
  });

  it('displays file size in MB when template is large', async () => {
    server.use(
      http.get('/api/v1/settings/invoice-template/preview', () =>
        HttpResponse.json({
          filename: 'large-template.docx',
          size: 2 * 1024 * 1024,
          uploadedAt: '2026-05-01T00:00:00Z',
          isDefault: false,
        }),
      ),
    );
    renderPage();
    await waitFor(() => expect(screen.getByTestId('template-size')).toBeInTheDocument(), {
      timeout: 3000,
    });
    expect(screen.getByTestId('template-size').textContent).toContain('MB');
  });

  it('refetches metadata after successful upload', async () => {
    let metadataCallCount = 0;
    server.use(
      http.get('/api/v1/settings/invoice-template/preview', () => {
        metadataCallCount++;
        return HttpResponse.json({
          filename: 'invoice-template.docx',
          size: 8192,
          uploadedAt: '2026-01-01T00:00:00Z',
          isDefault: true,
        });
      }),
    );
    renderPage();
    await waitFor(() => expect(screen.getByTestId('template-upload-form')).toBeInTheDocument(), {
      timeout: 3000,
    });
    const firstCount = metadataCallCount;

    const fileInput = screen.getByTestId('template-file-input');
    const file = new File(['content'], 'new-template.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const user = userEvent.setup();
    await user.upload(fileInput, file);
    await user.click(screen.getByTestId('btn-upload-template'));

    await waitFor(() => expect(metadataCallCount).toBeGreaterThan(firstCount), { timeout: 3000 });
  });
});
