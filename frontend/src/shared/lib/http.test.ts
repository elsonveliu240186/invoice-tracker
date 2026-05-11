import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http as mswHttp, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { http, ApiError } from './http';

describe('http wrapper', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns parsed JSON for a successful response', async () => {
    server.use(
      mswHttp.get('/test/ok', () => HttpResponse.json({ value: 42 })),
    );
    const result = await http<{ value: number }>('/test/ok');
    expect(result).toEqual({ value: 42 });
  });

  it('sends credentials: include on every request', async () => {
    const spy = vi.spyOn(globalThis, 'fetch');
    server.use(mswHttp.get('/test/creds', () => HttpResponse.json({})));
    await http('/test/creds');
    expect(spy).toHaveBeenCalledWith(
      '/test/creds',
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('parses problem+json into ApiError preserving code, status, detail', async () => {
    server.use(
      mswHttp.get('/test/problem', () =>
        HttpResponse.json(
          {
            type: 'about:blank',
            title: 'Conflict',
            status: 409,
            detail: 'A client with this email already exists.',
            code: 'CLIENT_EMAIL_TAKEN',
          },
          {
            status: 409,
            headers: { 'Content-Type': 'application/problem+json' },
          },
        ),
      ),
    );

    let caught: unknown;
    try {
      await http('/test/problem');
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(ApiError);
    const apiErr = caught as ApiError;
    expect(apiErr.status).toBe(409);
    expect(apiErr.code).toBe('CLIENT_EMAIL_TAKEN');
    expect(apiErr.detail).toContain('email');
  });

  it('parses application/json errors into ApiError', async () => {
    server.use(
      mswHttp.get('/test/json-error', () =>
        HttpResponse.json(
          { status: 404, detail: 'Not found', code: 'CLIENT_NOT_FOUND' },
          { status: 404 },
        ),
      ),
    );

    await expect(http('/test/json-error')).rejects.toBeInstanceOf(ApiError);
  });

  it('handles non-json error responses gracefully', async () => {
    server.use(
      mswHttp.get('/test/plain-error', () =>
        new HttpResponse('Server Error', {
          status: 500,
          headers: { 'Content-Type': 'text/plain' },
        }),
      ),
    );

    let caught: unknown;
    try {
      await http('/test/plain-error');
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(ApiError);
    expect((caught as ApiError).status).toBe(500);
  });

  it('returns undefined for 204 No Content', async () => {
    server.use(
      mswHttp.delete('/test/delete', () => new HttpResponse(null, { status: 204 })),
    );

    const result = await http<void>('/test/delete', { method: 'DELETE' });
    expect(result).toBeUndefined();
  });
});
