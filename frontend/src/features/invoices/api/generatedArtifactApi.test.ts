import { describe, it, expect, vi, beforeEach } from 'vitest';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import {
  getArtifactsMetadata,
  generateArtifact,
  downloadGeneratedArtifact,
  getPreviewPdfBlobUrl,
} from './generatedArtifactApi';

vi.mock('@/features/auth/model/useAuthStore', () => ({
  useAuthStore: { getState: vi.fn().mockReturnValue({ user: null }) },
}));

const INVOICE_ID = 'inv-uuid-1';

const MOCK_METADATA = {
  pdf: { format: 'PDF', generatedAt: '2026-05-14T10:00:00Z', sizeBytes: 12345, sha256: 'abc' },
  docx: null,
};

const MOCK_ARTIFACT = {
  format: 'PDF',
  generatedAt: '2026-05-14T10:00:00Z',
  sizeBytes: 12345,
  sha256: 'abc123',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getArtifactsMetadata', () => {
  it('returns metadata on success', async () => {
    server.use(
      http.get(`/api/v1/invoices/${INVOICE_ID}/generated/metadata`, () =>
        HttpResponse.json(MOCK_METADATA),
      ),
    );
    const result = await getArtifactsMetadata(INVOICE_ID);
    expect(result.pdf).not.toBeNull();
    expect(result.docx).toBeNull();
  });

  it('throws ApiError on 404', async () => {
    server.use(
      http.get(`/api/v1/invoices/${INVOICE_ID}/generated/metadata`, () =>
        HttpResponse.json(
          { status: 404, code: 'INVOICE_NOT_FOUND', detail: 'Not found' },
          { status: 404 },
        ),
      ),
    );
    await expect(getArtifactsMetadata(INVOICE_ID)).rejects.toMatchObject({ status: 404 });
  });

  it('throws ApiError on network error', async () => {
    server.use(
      http.get(`/api/v1/invoices/${INVOICE_ID}/generated/metadata`, () => HttpResponse.error()),
    );
    await expect(getArtifactsMetadata(INVOICE_ID)).rejects.toThrow();
  });
});

describe('generateArtifact', () => {
  it('returns artifact on success', async () => {
    server.use(
      http.post(`/api/v1/invoices/${INVOICE_ID}/generate`, () =>
        HttpResponse.json(MOCK_ARTIFACT, { status: 201 }),
      ),
    );
    const result = await generateArtifact(INVOICE_ID, 'PDF');
    expect(result.format).toBe('PDF');
    expect(result.sizeBytes).toBe(12345);
  });

  it('passes overwrite=true flag', async () => {
    let capturedUrl = '';
    server.use(
      http.post(`/api/v1/invoices/${INVOICE_ID}/generate`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(MOCK_ARTIFACT, { status: 201 });
      }),
    );
    await generateArtifact(INVOICE_ID, 'PDF', true);
    expect(capturedUrl).toContain('overwrite=true');
  });

  it('throws ApiError on 409 ARTIFACT_ALREADY_EXISTS', async () => {
    server.use(
      http.post(`/api/v1/invoices/${INVOICE_ID}/generate`, () =>
        HttpResponse.json(
          { status: 409, code: 'ARTIFACT_ALREADY_EXISTS', detail: 'Already exists' },
          { status: 409 },
        ),
      ),
    );
    await expect(generateArtifact(INVOICE_ID, 'PDF')).rejects.toMatchObject({ status: 409 });
  });

  it('throws ApiError on 502', async () => {
    server.use(
      http.post(`/api/v1/invoices/${INVOICE_ID}/generate`, () =>
        HttpResponse.json(
          { status: 502, code: 'PDF_CONVERSION_FAILED', detail: 'Conversion failed' },
          { status: 502 },
        ),
      ),
    );
    await expect(generateArtifact(INVOICE_ID, 'DOCX')).rejects.toMatchObject({ status: 502 });
  });
});

describe('downloadGeneratedArtifact', () => {
  it('triggers download on success', async () => {
    const createObjectURLMock = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    const revokeObjectURLMock = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    server.use(
      http.get(
        `/api/v1/invoices/${INVOICE_ID}/generated`,
        () =>
          new HttpResponse(new Uint8Array([0x25, 0x50, 0x44, 0x46]).buffer, {
            headers: { 'Content-Type': 'application/pdf' },
          }),
      ),
    );

    const anchor = {
      href: '',
      download: '',
      style: { display: '' },
      click: vi.fn(),
    } as unknown as HTMLAnchorElement;
    const clickSpy = vi.spyOn(anchor, 'click');
    vi.spyOn(document, 'createElement').mockReturnValue(anchor);
    vi.spyOn(document.body, 'appendChild').mockReturnValue(anchor);
    vi.spyOn(document.body, 'removeChild').mockReturnValue(anchor);

    await downloadGeneratedArtifact(INVOICE_ID, 'PDF', 'invoice-INV-001.pdf');
    expect(createObjectURLMock).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:test');
    expect(clickSpy).toHaveBeenCalled();

    createObjectURLMock.mockRestore();
    revokeObjectURLMock.mockRestore();
  });

  it('throws ApiError on 404', async () => {
    server.use(
      http.get(`/api/v1/invoices/${INVOICE_ID}/generated`, () =>
        HttpResponse.json(
          { status: 404, code: 'GENERATED_ARTIFACT_NOT_FOUND', detail: 'Not found' },
          { status: 404 },
        ),
      ),
    );
    await expect(downloadGeneratedArtifact(INVOICE_ID, 'PDF', 'test.pdf')).rejects.toMatchObject({
      status: 404,
    });
  });
});

describe('getPreviewPdfBlobUrl', () => {
  it('returns blob URL on success', async () => {
    const createObjectURLMock = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:preview-url');

    server.use(
      http.get(
        `/api/v1/invoices/${INVOICE_ID}/preview-pdf`,
        () =>
          new HttpResponse('%PDF-1.4\n' + '0'.repeat(100), {
            headers: { 'Content-Type': 'application/pdf' },
          }),
      ),
    );

    const result = await getPreviewPdfBlobUrl(INVOICE_ID);
    expect(result).toBe('blob:preview-url');
    expect(createObjectURLMock).toHaveBeenCalled();

    createObjectURLMock.mockRestore();
  });

  it('throws ApiError on 404', async () => {
    server.use(
      http.get(`/api/v1/invoices/${INVOICE_ID}/preview-pdf`, () =>
        HttpResponse.json(
          { status: 404, code: 'INVOICE_NOT_FOUND', detail: 'Not found' },
          { status: 404 },
        ),
      ),
    );
    await expect(getPreviewPdfBlobUrl(INVOICE_ID)).rejects.toMatchObject({ status: 404 });
  });

  it('throws on network error', async () => {
    server.use(http.get(`/api/v1/invoices/${INVOICE_ID}/preview-pdf`, () => HttpResponse.error()));
    await expect(getPreviewPdfBlobUrl(INVOICE_ID)).rejects.toThrow();
  });
});
