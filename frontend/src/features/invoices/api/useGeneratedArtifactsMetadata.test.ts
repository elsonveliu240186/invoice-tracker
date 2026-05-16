import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import { useGeneratedArtifactsMetadata } from './useGeneratedArtifactsMetadata';

const INVOICE_ID = 'inv-uuid-1';

const MOCK_METADATA = {
  pdf: { format: 'PDF', generatedAt: '2026-05-14T10:00:00Z', sizeBytes: 12345, sha256: 'abc' },
  docx: null,
};

beforeEach(() => {
  server.use(
    http.get(`/api/v1/invoices/${INVOICE_ID}/generated/metadata`, () =>
      HttpResponse.json(MOCK_METADATA),
    ),
  );
});

describe('useGeneratedArtifactsMetadata', () => {
  it('starts in loading state', () => {
    const { result } = renderHook(() => useGeneratedArtifactsMetadata(INVOICE_ID));
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('resolves data on success', async () => {
    const { result } = renderHook(() => useGeneratedArtifactsMetadata(INVOICE_ID));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).not.toBeNull();
    expect(result.current.data?.pdf?.format).toBe('PDF');
    expect(result.current.data?.docx).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('sets error on API failure', async () => {
    server.use(
      http.get(`/api/v1/invoices/${INVOICE_ID}/generated/metadata`, () =>
        HttpResponse.json({ status: 404, code: 'INVOICE_NOT_FOUND' }, { status: 404 }),
      ),
    );
    const { result } = renderHook(() => useGeneratedArtifactsMetadata(INVOICE_ID));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBeNull();
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.status).toBe(404);
  });

  it('does nothing when invoiceId is null', () => {
    const { result } = renderHook(() => useGeneratedArtifactsMetadata(null));
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
  });

  it('refetch increments revision and re-fetches', async () => {
    let callCount = 0;
    server.use(
      http.get(`/api/v1/invoices/${INVOICE_ID}/generated/metadata`, () => {
        callCount++;
        return HttpResponse.json(MOCK_METADATA);
      }),
    );
    const { result } = renderHook(() => useGeneratedArtifactsMetadata(INVOICE_ID));
    await waitFor(() => expect(result.current.loading).toBe(false));
    const firstCount = callCount;
    result.current.refetch();
    await waitFor(() => expect(callCount).toBeGreaterThan(firstCount));
  });
});
