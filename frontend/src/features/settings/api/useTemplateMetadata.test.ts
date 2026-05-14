import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import { useTemplateMetadata } from './useTemplateMetadata';
import { resetMockTemplateMetadata } from '@/mocks/handlers';

beforeEach(() => {
  resetMockTemplateMetadata();
});

describe('useTemplateMetadata', () => {
  it('starts with loading=true and data=null', () => {
    const { result } = renderHook(() => useTemplateMetadata());
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('transitions to data on success', async () => {
    const { result } = renderHook(() => useTemplateMetadata());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).not.toBeNull();
    expect(result.current.data?.filename).toBe('invoice-template.docx');
    expect(result.current.data?.isDefault).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('transitions to error on server failure', async () => {
    server.use(
      http.get('/api/v1/settings/invoice-template/preview', () =>
        HttpResponse.json({ status: 500, detail: 'Server error' }, { status: 500 }),
      ),
    );
    const { result } = renderHook(() => useTemplateMetadata());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBeNull();
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.status).toBe(500);
  });

  it('refetches when refetch is called', async () => {
    const { result } = renderHook(() => useTemplateMetadata());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Override handler for next call
    server.use(
      http.get('/api/v1/settings/invoice-template/preview', () =>
        HttpResponse.json({
          filename: 'updated-template.docx',
          size: 99999,
          uploadedAt: '2026-06-01T00:00:00Z',
          isDefault: false,
        }),
      ),
    );

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data?.filename).toBe('updated-template.docx');
    expect(result.current.data?.isDefault).toBe(false);
  });
});
