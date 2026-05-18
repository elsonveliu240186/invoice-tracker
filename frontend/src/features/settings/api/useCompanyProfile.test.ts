import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import { useCompanyProfile } from './useCompanyProfile';
import { resetMockCompanyProfile } from '@/mocks/handlers';

beforeEach(() => {
  resetMockCompanyProfile();
});

describe('useCompanyProfile', () => {
  it('starts with loading=true and data=null', () => {
    const { result } = renderHook(() => useCompanyProfile());
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('transitions to data on success', async () => {
    const { result } = renderHook(() => useCompanyProfile());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).not.toBeNull();
    expect(typeof result.current.data?.name).toBe('string');
    expect(result.current.error).toBeNull();
  });

  it('transitions to error on server failure', async () => {
    server.use(
      http.get('/api/v1/settings/company', () =>
        HttpResponse.json({ status: 500, detail: 'Server error' }, { status: 500 }),
      ),
    );
    const { result } = renderHook(() => useCompanyProfile());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBeNull();
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.status).toBe(500);
  });

  it('refetches when refetch is called', async () => {
    server.use(
      http.get('/api/v1/settings/company', () =>
        HttpResponse.json({
          name: 'Original Co',
          email: '',
          phone: '',
          address: '',
          vatNumber: '',
          iban: '',
          swiftBic: '',
          bankName: '',
          updatedAt: '2026-01-01T00:00:00Z',
        }),
      ),
    );
    const { result } = renderHook(() => useCompanyProfile());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data?.name).toBe('Original Co');

    server.use(
      http.get('/api/v1/settings/company', () =>
        HttpResponse.json({
          name: 'Updated Co',
          email: '',
          phone: '',
          address: '',
          vatNumber: '',
          iban: '',
          swiftBic: '',
          bankName: '',
          updatedAt: '2026-02-01T00:00:00Z',
        }),
      ),
    );

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data?.name).toBe('Updated Co');
  });
});
