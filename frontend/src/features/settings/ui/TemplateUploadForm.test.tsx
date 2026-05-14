import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/lib/i18n';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import { resetMockTemplateMetadata } from '@/mocks/handlers';
import { TemplateUploadForm } from './TemplateUploadForm';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  resetMockTemplateMetadata();
  vi.clearAllMocks();
});

function renderForm(onUploadSuccess?: () => void) {
  return render(
    <I18nextProvider i18n={i18n}>
      <TemplateUploadForm {...(onUploadSuccess ? { onUploadSuccess } : {})} />
    </I18nextProvider>,
  );
}

function makeDocxFile(name = 'template.docx', sizeBytes = 1024): File {
  return new File([new Uint8Array(sizeBytes)], name, {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

describe('TemplateUploadForm', () => {
  it('renders the file input and upload button', () => {
    renderForm();
    expect(screen.getByTestId('template-file-input')).toBeInTheDocument();
    expect(screen.getByTestId('btn-upload-template')).toBeInTheDocument();
  });

  it('upload button is disabled when no file is selected', () => {
    renderForm();
    expect(screen.getByTestId('btn-upload-template')).toBeDisabled();
  });

  it('upload button becomes enabled when a valid .docx file is selected', async () => {
    const user = userEvent.setup();
    renderForm();
    const input = screen.getByTestId('template-file-input');
    await user.upload(input, makeDocxFile());
    expect(screen.getByTestId('btn-upload-template')).not.toBeDisabled();
  });

  it('shows error toast for non-docx file', async () => {
    const { toast } = await import('sonner');
    renderForm();
    const input = screen.getByTestId('template-file-input');
    const pdfFile = new File(['data'], 'template.pdf', { type: 'application/pdf' });
    // Use fireEvent to bypass the accept attribute filter in jsdom/user-event
    fireEvent.change(input, { target: { files: [pdfFile] } });
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('docx'));
    expect(screen.getByTestId('btn-upload-template')).toBeDisabled();
  });

  it('shows error toast for file larger than 5 MB', async () => {
    const { toast } = await import('sonner');
    const user = userEvent.setup();
    renderForm();
    const input = screen.getByTestId('template-file-input');
    const bigFile = new File([new Uint8Array(6 * 1024 * 1024)], 'big.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    await user.upload(input, bigFile);
    expect(toast.error).toHaveBeenCalledWith(expect.any(String));
    expect(screen.getByTestId('btn-upload-template')).toBeDisabled();
  });

  it('calls onUploadSuccess and shows success toast on successful upload', async () => {
    const { toast } = await import('sonner');
    const onUploadSuccess = vi.fn();
    const user = userEvent.setup();
    renderForm(onUploadSuccess);
    const input = screen.getByTestId('template-file-input');
    await user.upload(input, makeDocxFile());
    await user.click(screen.getByTestId('btn-upload-template'));
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(onUploadSuccess).toHaveBeenCalledTimes(1);
  });

  it('shows error toast when API returns 415', async () => {
    server.use(
      http.post('/api/v1/settings/invoice-template', () =>
        HttpResponse.json(
          { status: 415, code: 'INVALID_TEMPLATE_TYPE', detail: 'Only .docx accepted' },
          { status: 415 },
        ),
      ),
    );
    const { toast } = await import('sonner');
    const user = userEvent.setup();
    renderForm();
    const input = screen.getByTestId('template-file-input');
    await user.upload(input, makeDocxFile());
    await user.click(screen.getByTestId('btn-upload-template'));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });

  it('disables button while upload is pending', async () => {
    let resolveUpload!: () => void;
    server.use(
      http.post(
        '/api/v1/settings/invoice-template',
        () =>
          new Promise((resolve) => {
            resolveUpload = () =>
              resolve(
                HttpResponse.json({
                  filename: 'invoice-template.docx',
                  size: 1024,
                  uploadedAt: '2026-05-13T20:10:00Z',
                }),
              );
          }),
      ),
    );
    const user = userEvent.setup();
    renderForm();
    const input = screen.getByTestId('template-file-input');
    await user.upload(input, makeDocxFile());
    await user.click(screen.getByTestId('btn-upload-template'));
    // Button should be disabled while pending
    expect(screen.getByTestId('btn-upload-template')).toBeDisabled();
    resolveUpload();
    await waitFor(() => expect(screen.getByTestId('btn-upload-template')).toBeDisabled()); // no file after success
  });
});
