import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http as mswHttp, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { http, httpRaw, ApiError, setOn401Handler } from './http';

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

describe('httpRaw', () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    const { useAuthStore } = await import('@/features/auth/model/useAuthStore');
    useAuthStore.setState({ user: null, status: 'unauthenticated', error: null });
  });

  it('returns the raw Response object on 200', async () => {
    server.use(
      mswHttp.get('/test/raw/ok', () => {
        return new HttpResponse('binary-data', {
          status: 200,
          headers: { 'Content-Type': 'application/octet-stream' },
        });
      }),
    );
    const response = await httpRaw('/test/raw/ok');
    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toBe('binary-data');
  });

  it('throws ApiError on 4xx', async () => {
    server.use(
      mswHttp.get('/test/raw/404', () =>
        HttpResponse.json(
          { status: 404, code: 'NOT_FOUND', detail: 'Resource not found' },
          { status: 404 },
        ),
      ),
    );
    await expect(httpRaw('/test/raw/404')).rejects.toBeInstanceOf(ApiError);
  });

  it('does not set Content-Type when body is FormData', async () => {
    const spy = vi.spyOn(globalThis, 'fetch');
    server.use(
      mswHttp.post('/test/raw/upload', () => HttpResponse.json({ ok: true }, { status: 200 })),
    );
    const formData = new FormData();
    formData.append('file', new Blob(['data'], { type: 'application/octet-stream' }), 'file.docx');
    await httpRaw('/test/raw/upload', { method: 'POST', body: formData });
    const callArgs = spy.mock.calls[0];
    const opts = callArgs?.[1] as RequestInit & { headers?: Record<string, string> };
    expect(opts?.headers?.['Content-Type']).toBeUndefined();
  });

  it('sets Content-Type for non-FormData body', async () => {
    const spy = vi.spyOn(globalThis, 'fetch');
    server.use(mswHttp.get('/test/raw/json', () => HttpResponse.json({ ok: true })));
    await httpRaw('/test/raw/json');
    const callArgs = spy.mock.calls[0];
    const opts = callArgs?.[1] as RequestInit & { headers?: Record<string, string> };
    expect(opts?.headers?.['Content-Type']).toBe('application/json');
  });

  it('attaches Authorization header when session has basicAuthToken', async () => {
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
    server.use(mswHttp.get('/test/raw/auth', () => HttpResponse.json({ ok: true })));
    await httpRaw('/test/raw/auth');
    const callArgs = spy.mock.calls[0];
    const opts = callArgs?.[1] as RequestInit & { headers?: Record<string, string> };
    expect(opts?.headers?.['Authorization']).toBe('Basic dGVzdA==');
  });
});
