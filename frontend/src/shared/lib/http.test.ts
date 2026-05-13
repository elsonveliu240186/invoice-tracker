import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http as mswHttp, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { http, ApiError, setOn401Handler } from './http';

vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: vi.fn(() => ({})),
  signInWithPopup: vi.fn(),
}));
vi.mock('@/shared/lib/firebase', () => ({
  getFirebaseAuth: vi.fn(() => ({})),
}));

describe('http wrapper', () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    const { useAuthStore } = await import('@/features/auth/model/useAuthStore');
    useAuthStore.setState({ user: null, status: 'unauthenticated', error: null });
  });

  it('returns parsed JSON for a successful response', async () => {
    server.use(mswHttp.get('/test/ok', () => HttpResponse.json({ value: 42 })));
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

  it('attaches Authorization: Basic header when session has basicAuthToken', async () => {
    const { useAuthStore } = await import('@/features/auth/model/useAuthStore');
    useAuthStore.setState({
      user: {
        email: 'u@e.com',
        displayName: 'U',
        provider: 'password',
        basicAuthToken: 'dGVzdA==',
      },
      status: 'authenticated',
    });
    const spy = vi.spyOn(globalThis, 'fetch');
    server.use(mswHttp.get('/test/auth', () => HttpResponse.json({ ok: true })));
    await http('/test/auth');
    const callArgs = spy.mock.calls[0];
    const opts = callArgs?.[1] as RequestInit & { headers?: Record<string, string> };
    expect(opts?.headers?.['Authorization']).toBe('Basic dGVzdA==');
  });

  it('does not attach Authorization header when no session', async () => {
    const spy = vi.spyOn(globalThis, 'fetch');
    server.use(mswHttp.get('/test/noauth', () => HttpResponse.json({ ok: true })));
    await http('/test/noauth');
    const callArgs = spy.mock.calls[0];
    const opts = callArgs?.[1] as RequestInit & { headers?: Record<string, string> };
    expect(opts?.headers?.['Authorization']).toBeUndefined();
  });

  it('invokes the on401 handler when a 401 is received', async () => {
    const handler = vi.fn();
    setOn401Handler(handler);
    server.use(
      mswHttp.get('/test/401', () =>
        HttpResponse.json({ status: 401, detail: 'Unauthorized' }, { status: 401 }),
      ),
    );
    try {
      await http('/test/401');
    } catch {
      // expected
    }
    expect(handler).toHaveBeenCalledTimes(1);
    // reset handler
    setOn401Handler(() => {});
  });

  it('does not invoke on401 handler for non-401 errors', async () => {
    const handler = vi.fn();
    setOn401Handler(handler);
    server.use(mswHttp.get('/test/500', () => new HttpResponse(null, { status: 500 })));
    try {
      await http('/test/500');
    } catch {
      // expected
    }
    expect(handler).not.toHaveBeenCalled();
    setOn401Handler(() => {});
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
      mswHttp.get(
        '/test/plain-error',
        () =>
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
    server.use(mswHttp.delete('/test/delete', () => new HttpResponse(null, { status: 204 })));

    const result = await http<void>('/test/delete', { method: 'DELETE' });
    expect(result).toBeUndefined();
  });
});
