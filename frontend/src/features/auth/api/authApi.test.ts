import { describe, it, expect } from 'vitest';
import { http as mswHttp, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { loginRequest, registerRequest, forgotPasswordRequest } from './authApi';
import { ApiError } from '@/shared/lib/http';

describe('authApi.loginRequest', () => {
  it('returns LoginResponse on 200', async () => {
    server.use(
      mswHttp.post('/api/v1/auth/login', () =>
        HttpResponse.json({ email: 'user@example.com', displayName: 'Alice' }),
      ),
    );
    const result = await loginRequest({ email: 'user@example.com', password: 'pass' });
    expect(result.email).toBe('user@example.com');
    expect(result.displayName).toBe('Alice');
  });

  it('throws ApiError with status 401 on invalid credentials', async () => {
    server.use(
      mswHttp.post('/api/v1/auth/login', () =>
        HttpResponse.json(
          {
            status: 401,
            title: 'Unauthorized',
            detail: 'Bad credentials',
            code: 'BAD_CREDENTIALS',
          },
          { status: 401, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    );
    await expect(
      loginRequest({ email: 'user@example.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(ApiError);
    try {
      await loginRequest({ email: 'user@example.com', password: 'wrong' });
    } catch (err) {
      expect((err as ApiError).status).toBe(401);
      expect((err as ApiError).code).toBe('BAD_CREDENTIALS');
    }
  });

  it('throws ApiError on 500', async () => {
    server.use(
      mswHttp.post(
        '/api/v1/auth/login',
        () =>
          new HttpResponse('Internal Server Error', {
            status: 500,
            headers: { 'Content-Type': 'text/plain' },
          }),
      ),
    );
    await expect(loginRequest({ email: 'u@e.com', password: 'p' })).rejects.toBeInstanceOf(
      ApiError,
    );
  });
});

describe('authApi.registerRequest', () => {
  it('returns RegisterResponse on 201', async () => {
    server.use(
      mswHttp.post('/api/v1/auth/register', () =>
        HttpResponse.json({ email: 'new@example.com', displayName: 'Bob' }, { status: 201 }),
      ),
    );
    const result = await registerRequest({
      displayName: 'Bob',
      email: 'new@example.com',
      password: 'Password1',
    });
    expect(result.email).toBe('new@example.com');
  });

  it('throws ApiError 409 on duplicate email', async () => {
    server.use(
      mswHttp.post('/api/v1/auth/register', () =>
        HttpResponse.json(
          { status: 409, detail: 'Email taken', code: 'USER_EMAIL_TAKEN' },
          { status: 409, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    );
    let caught: unknown;
    try {
      await registerRequest({
        displayName: 'Bob',
        email: 'dup@example.com',
        password: 'Password1',
      });
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(ApiError);
    expect((caught as ApiError).status).toBe(409);
    expect((caught as ApiError).code).toBe('USER_EMAIL_TAKEN');
  });

  it('throws ApiError on 400 validation error', async () => {
    server.use(
      mswHttp.post('/api/v1/auth/register', () =>
        HttpResponse.json({ status: 400, detail: 'Bad request' }, { status: 400 }),
      ),
    );
    await expect(
      registerRequest({ displayName: '', email: 'e@e.com', password: 'Password1' }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('throws ApiError on 500', async () => {
    server.use(
      mswHttp.post('/api/v1/auth/register', () => new HttpResponse(null, { status: 500 })),
    );
    await expect(
      registerRequest({ displayName: 'Bob', email: 'b@b.com', password: 'Password1' }),
    ).rejects.toBeInstanceOf(ApiError);
  });
});

describe('authApi.forgotPasswordRequest', () => {
  it('returns undefined on 204', async () => {
    server.use(
      mswHttp.post('/api/v1/auth/forgot-password', () => new HttpResponse(null, { status: 204 })),
    );
    const result = await forgotPasswordRequest({ email: 'user@example.com' });
    expect(result).toBeUndefined();
  });

  it('still succeeds on 204 even for unknown email (anti-enumeration)', async () => {
    server.use(
      mswHttp.post('/api/v1/auth/forgot-password', () => new HttpResponse(null, { status: 204 })),
    );
    await expect(forgotPasswordRequest({ email: 'unknown@example.com' })).resolves.toBeUndefined();
  });

  it('throws ApiError on 400', async () => {
    server.use(
      mswHttp.post('/api/v1/auth/forgot-password', () =>
        HttpResponse.json({ status: 400, detail: 'invalid email' }, { status: 400 }),
      ),
    );
    await expect(forgotPasswordRequest({ email: 'bad' })).rejects.toBeInstanceOf(ApiError);
  });
});
