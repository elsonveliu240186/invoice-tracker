import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import {
  useClients,
  useClient,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
} from './useClients';
import { ApiError } from '@/shared/lib/http';

describe('useClients', () => {
  it('fetches and returns page data', async () => {
    const { result } = renderHook(() => useClients());
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).not.toBeNull();
    expect(result.current.error).toBeNull();
    expect(Array.isArray(result.current.data?.content)).toBe(true);
  });

  it('exposes refetch to re-trigger the fetch', async () => {
    const { result } = renderHook(() => useClients());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.refetch());

    await waitFor(() => expect(result.current.loading).toBe(true));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).not.toBeNull();
  });

  it('sets error when the API fails', async () => {
    server.use(
      http.get('/api/v1/clients', () =>
        HttpResponse.json({ status: 500, detail: 'boom' }, { status: 500 }),
      ),
    );

    const { result } = renderHook(() => useClients());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).not.toBeNull();
    expect(result.current.data).toBeNull();
  });

  it('refetches when query changes', async () => {
    const { result, rerender } = renderHook(
      ({ q }: { q: string }) => useClients({ query: q }),
      { initialProps: { q: '' } },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    rerender({ q: 'Acme' });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).not.toBeNull();
  });
});

describe('useClient', () => {
  it('does not fetch when id is null', () => {
    const { result } = renderHook(() => useClient(null));
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
  });

  it('fetches client by id', async () => {
    const { result } = renderHook(() => useClient('uuid-1'));
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data?.id).toBe('uuid-1');
    expect(result.current.error).toBeNull();
  });

  it('sets error for unknown id', async () => {
    const { result } = renderHook(() => useClient('does-not-exist'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).not.toBeNull();
  });
});

describe('useCreateClient', () => {
  it('returns client on success', async () => {
    const { result } = renderHook(() => useCreateClient());
    expect(result.current.loading).toBe(false);

    const results: { value: Awaited<ReturnType<typeof result.current.mutate>> | null } = { value: null };
    await act(async () => {
      results.value = await result.current.mutate({ name: 'Hook Co', email: 'hook@co.com' });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(results.value).not.toBeNull();
    expect(results.value!.name).toBe('Hook Co');
  });

  it('throws and sets error on failure', async () => {
    server.use(
      http.post('/api/v1/clients', () =>
        HttpResponse.json(
          { status: 409, code: 'CLIENT_EMAIL_TAKEN', detail: 'taken' },
          { status: 409 },
        ),
      ),
    );

    const { result } = renderHook(() => useCreateClient());

    let caughtError: unknown;
    await act(async () => {
      try {
        await result.current.mutate({ name: 'X', email: 'x@x.com' });
      } catch (err) {
        caughtError = err;
      }
    });

    expect(caughtError).toBeInstanceOf(ApiError);
    await waitFor(() => expect(result.current.error).not.toBeNull());
  });
});

describe('useUpdateClient', () => {
  it('returns updated client on success', async () => {
    const { result } = renderHook(() => useUpdateClient());

    const results: { value: Awaited<ReturnType<typeof result.current.mutate>> | null } = { value: null };
    await act(async () => {
      results.value = await result.current.mutate('uuid-2', {
        name: 'Globex Updated',
        email: 'globex@example.com',
      });
    });

    expect(results.value).not.toBeNull();
    expect(results.value!.name).toBe('Globex Updated');
    expect(result.current.error).toBeNull();
  });

  it('throws and sets error for unknown id', async () => {
    const { result } = renderHook(() => useUpdateClient());

    let caughtError: unknown;
    await act(async () => {
      try {
        await result.current.mutate('ghost', { name: 'X', email: 'x@x.com' });
      } catch (err) {
        caughtError = err;
      }
    });

    expect(caughtError).toBeInstanceOf(ApiError);
    await waitFor(() => expect(result.current.error).not.toBeNull());
  });
});

describe('useDeleteClient', () => {
  it('succeeds for a valid id', async () => {
    server.use(
      http.delete('/api/v1/clients/to-delete', () => new HttpResponse(null, { status: 204 })),
    );

    const { result } = renderHook(() => useDeleteClient());
    await act(async () => {
      await result.current.mutate('to-delete');
    });
    expect(result.current.error).toBeNull();
  });

  it('throws and sets error for unknown id', async () => {
    const { result } = renderHook(() => useDeleteClient());

    let caughtError: unknown;
    await act(async () => {
      try {
        await result.current.mutate('ghost-delete');
      } catch (err) {
        caughtError = err;
      }
    });

    expect(caughtError).toBeInstanceOf(ApiError);
    await waitFor(() => expect(result.current.error).not.toBeNull());
  });
});
