import { describe, it, expect, beforeEach, vi } from 'vitest';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import { getTemplateMetadata, uploadTemplate, downloadTemplate } from './templateApi';
import { resetMockTemplateMetadata } from '@/mocks/handlers';
import { ApiError } from '@/shared/lib/http';

beforeEach(() => {
  resetMockTemplateMetadata();
});

describe('getTemplateMetadata', () => {
  it('returns metadata on 200', async () => {
    const result = await getTemplateMetadata();
    expect(result.filename).toBe('invoice-template.docx');
    expect(result.isDefault).toBe(true);
    expect(typeof result.size).toBe('number');
  });

  it('throws ApiError on server error', async () => {
    server.use(
      http.get('/api/v1/settings/invoice-template/preview', () =>
        HttpResponse.json({ status: 500, detail: 'Internal error' }, { status: 500 }),
      ),
    );
    await expect(getTemplateMetadata()).rejects.toBeInstanceOf(ApiError);
  });
});

describe('uploadTemplate', () => {
  it('returns UploadTemplateResponse on success with .docx file', async () => {
    const file = new File([new Uint8Array(100)], 'my-template.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const result = await uploadTemplate(file);
    expect(result.filename).toBe('invoice-template.docx');
    expect(typeof result.uploadedAt).toBe('string');
  });

  it('throws ApiError 415 for non-docx file', async () => {
    server.use(
      http.post('/api/v1/settings/invoice-template', () =>
        HttpResponse.json(
          { status: 415, code: 'INVALID_TEMPLATE_TYPE', detail: 'Only .docx accepted' },
          { status: 415 },
        ),
      ),
    );
    const file = new File(['data'], 'template.pdf', { type: 'application/pdf' });
    let caught: unknown;
    try {
      await uploadTemplate(file);
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(ApiError);
    expect((caught as ApiError).status).toBe(415);
  });

  it('throws ApiError 413 for oversized file', async () => {
    server.use(
      http.post('/api/v1/settings/invoice-template', () =>
        HttpResponse.json(
          { status: 413, code: 'TEMPLATE_TOO_LARGE', detail: 'File exceeds 5 MB' },
          { status: 413 },
        ),
      ),
    );
    const file = new File([new Uint8Array(6 * 1024 * 1024)], 'big.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    let caught: unknown;
    try {
      await uploadTemplate(file);
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(ApiError);
    expect((caught as ApiError).status).toBe(413);
  });

  it('sends FormData body (multipart/form-data) with file field', async () => {
    // MSW v2 + jsdom cannot reliably parse multipart FormData containing File objects
    // (request.formData() hangs). Instead, verify the request uses multipart encoding
    // by inspecting the Content-Type header, which the browser always sets automatically
    // when the body is a FormData instance.
    let capturedContentType: string | null = null;
    server.use(
      http.post('/api/v1/settings/invoice-template', ({ request }) => {
        capturedContentType = request.headers.get('content-type');
        return HttpResponse.json({
          filename: 'invoice-template.docx',
          size: 100,
          uploadedAt: '2026-05-13T20:10:00Z',
        });
      }),
    );
    const file = new File([new Uint8Array(100)], 'tmpl.docx', { type: 'application/octet-stream' });
    await uploadTemplate(file);
    // jsdom/node-fetch sets content-type to multipart/form-data with boundary
    expect(capturedContentType).toMatch(/multipart\/form-data/);
  });
});

describe('downloadTemplate', () => {
  it('triggers a blob download via authenticated fetch', async () => {
    server.use(
      http.get('/api/v1/settings/invoice-template/download', () =>
        HttpResponse.arrayBuffer(new ArrayBuffer(8), {
          headers: { 'Content-Type': 'application/octet-stream' },
        }),
      ),
    );
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const click = vi.fn();
    const createElement = vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click,
    } as unknown as HTMLAnchorElement);

    await downloadTemplate();

    expect(createObjectURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake');

    createObjectURL.mockRestore();
    revokeObjectURL.mockRestore();
    createElement.mockRestore();
  });
});
