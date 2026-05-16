import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http as mswHttp, HttpResponse } from 'msw';
import { server } from '@/mocks/server';

// Mock firebase/auth before importing the store
vi.mock('firebase/auth', () => {
  let _signInResult: Record<string, unknown> | null = null;
  let _signInError: Error | null = null;

  return {
    GoogleAuthProvider: vi.fn().mockImplementation(() => ({})),
    signInWithPopup: vi.fn(() => {
      if (_signInError) return Promise.reject(_signInError);
      return Promise.resolve(_signInResult);
    }),
    __setSignInResult: (r: Record<string, unknown>) => {
      _signInResult = r;
      _signInError = null;
    },
    __setSignInError: (e: Error) => {
      _signInError = e;
      _signInResult = null;
    },
  };
});

vi.mock('@/shared/lib/firebase', () => ({
  getFirebaseAuth: vi.fn(() => ({ currentUser: null })),
}));

// Helper to set mock results
async function setGoogleSignInResult(result: Record<string, unknown>) {
  const mod = await import('firebase/auth');
  (mod as unknown as { __setSignInResult: (r: Record<string, unknown>) => void }).__setSignInResult(
    result,
  );
}

async function setGoogleSignInError(error: Error) {
  const mod = await import('firebase/auth');
  (mod as unknown as { __setSignInError: (e: Error) => void }).__setSignInError(error);
}

describe('useAuthStore', () => {
  beforeEach(async () => {
    localStorage.clear();
    const { useAuthStore } = await import('./useAuthStore');
    useAuthStore.setState({ user: null, status: 'unauthenticated', error: null });
  });

  describe('login', () => {
    it('sets user and status to authenticated on success', async () => {
      server.use(
        mswHttp.post('/api/v1/auth/login', () =>
          HttpResponse.json({ email: 'user@example.com', displayName: 'Alice' }),
        ),
      );
      const { useAuthStore } = await import('./useAuthStore');
      await useAuthStore.getState().login('user@example.com', 'Password1');
      const state = useAuthStore.getState();
      expect(state.status).toBe('authenticated');
      expect(state.user?.email).toBe('user@example.com');
      expect(state.user?.displayName).toBe('Alice');
      expect(state.user?.provider).toBe('password');
      expect(state.user?.basicAuthToken).toBe(btoa('user@example.com:Password1'));
    });

    it('sets status to unauthenticated and throws on 401', async () => {
      server.use(
        mswHttp.post('/api/v1/auth/login', () =>
          HttpResponse.json(
            { status: 401, code: 'BAD_CREDENTIALS', detail: 'Invalid credentials' },
            { status: 401 },
          ),
        ),
      );
      const { useAuthStore } = await import('./useAuthStore');
      await expect(
        useAuthStore.getState().login('user@example.com', 'wrong'),
      ).rejects.toBeDefined();
      expect(useAuthStore.getState().status).toBe('unauthenticated');
      expect(useAuthStore.getState().user).toBeNull();
    });

    it('persists user session to localStorage', async () => {
      server.use(
        mswHttp.post('/api/v1/auth/login', () =>
          HttpResponse.json({ email: 'user@example.com', displayName: 'Alice' }),
        ),
      );
      const { useAuthStore } = await import('./useAuthStore');
      await useAuthStore.getState().login('user@example.com', 'Password1');
      const stored = localStorage.getItem('it.auth');
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!) as { state: { user: unknown } };
      expect(parsed.state.user).toBeTruthy();
    });
  });

  describe('loginWithGoogle', () => {
    it('sets user and status to authenticated on success', async () => {
      await setGoogleSignInResult({
        user: {
          email: 'google@example.com',
          displayName: 'Google User',
          getIdToken: () => Promise.resolve('fake-id-token'),
        },
      });
      const { useAuthStore } = await import('./useAuthStore');
      await useAuthStore.getState().loginWithGoogle();
      const state = useAuthStore.getState();
      expect(state.status).toBe('authenticated');
      expect(state.user?.email).toBe('google@example.com');
      expect(state.user?.provider).toBe('google');
      expect(state.user?.idToken).toBe('fake-id-token');
    });

    it('sets status to unauthenticated and throws on popup-blocked error', async () => {
      const err = Object.assign(new Error('Popup blocked'), { code: 'auth/popup-blocked' });
      await setGoogleSignInError(err);
      const { useAuthStore } = await import('./useAuthStore');
      await expect(useAuthStore.getState().loginWithGoogle()).rejects.toBeDefined();
      expect(useAuthStore.getState().status).toBe('unauthenticated');
    });

    it('falls back to empty string when Google user email and displayName are null', async () => {
      await setGoogleSignInResult({
        user: {
          email: null,
          displayName: null,
          getIdToken: () => Promise.resolve('fake-id-token'),
        },
      });
      const { useAuthStore } = await import('./useAuthStore');
      await useAuthStore.getState().loginWithGoogle();
      const state = useAuthStore.getState();
      expect(state.status).toBe('authenticated');
      expect(state.user?.email).toBe('');
      expect(state.user?.displayName).toBe('');
    });
  });

  describe('register', () => {
    it('resolves and sets status to unauthenticated (user must sign in)', async () => {
      server.use(
        mswHttp.post('/api/v1/auth/register', () =>
          HttpResponse.json({ email: 'new@example.com', displayName: 'Bob' }, { status: 201 }),
        ),
      );
      const { useAuthStore } = await import('./useAuthStore');
      await useAuthStore.getState().register('Bob', 'new@example.com', 'Password1');
      expect(useAuthStore.getState().status).toBe('unauthenticated');
      expect(useAuthStore.getState().user).toBeNull();
    });

    it('throws and sets error on 409', async () => {
      server.use(
        mswHttp.post('/api/v1/auth/register', () =>
          HttpResponse.json({ status: 409, code: 'USER_EMAIL_TAKEN' }, { status: 409 }),
        ),
      );
      const { useAuthStore } = await import('./useAuthStore');
      await expect(
        useAuthStore.getState().register('Bob', 'dup@example.com', 'Password1'),
      ).rejects.toBeDefined();
      expect(useAuthStore.getState().status).toBe('unauthenticated');
    });
  });

  describe('forgotPassword', () => {
    it('resolves silently regardless of server response (anti-enumeration)', async () => {
      server.use(
        mswHttp.post('/api/v1/auth/forgot-password', () => new HttpResponse(null, { status: 204 })),
      );
      const { useAuthStore } = await import('./useAuthStore');
      await expect(
        useAuthStore.getState().forgotPassword('user@example.com'),
      ).resolves.toBeUndefined();
      expect(useAuthStore.getState().status).toBe('unauthenticated');
    });

    it('does not throw even when server returns 500', async () => {
      server.use(
        mswHttp.post('/api/v1/auth/forgot-password', () => new HttpResponse(null, { status: 500 })),
      );
      const { useAuthStore } = await import('./useAuthStore');
      await expect(
        useAuthStore.getState().forgotPassword('user@example.com'),
      ).resolves.toBeUndefined();
    });
  });

  describe('logout', () => {
    it('clears user and sets status to unauthenticated', async () => {
      const { useAuthStore } = await import('./useAuthStore');
      useAuthStore.setState({
        user: { email: 'u@e.com', displayName: 'U', provider: 'password' },
        status: 'authenticated',
      });
      useAuthStore.getState().logout();
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().status).toBe('unauthenticated');
    });

    it('clears localStorage on logout', async () => {
      const { useAuthStore } = await import('./useAuthStore');
      useAuthStore.setState({
        user: { email: 'u@e.com', displayName: 'U', provider: 'password' },
        status: 'authenticated',
      });
      useAuthStore.getState().logout();
      const stored = localStorage.getItem('it.auth');
      // After logout user should be null in stored state
      if (stored) {
        const parsed = JSON.parse(stored) as { state: { user: unknown } };
        expect(parsed.state.user).toBeNull();
      }
    });
  });

  describe('hydrate', () => {
    it('sets status to authenticated when a valid session exists', async () => {
      const { useAuthStore } = await import('./useAuthStore');
      useAuthStore.setState({
        user: { email: 'u@e.com', displayName: 'U', provider: 'password' },
        status: 'unauthenticated',
      });
      useAuthStore.getState().hydrate();
      expect(useAuthStore.getState().status).toBe('authenticated');
    });

    it('sets status to unauthenticated when no session', async () => {
      const { useAuthStore } = await import('./useAuthStore');
      useAuthStore.setState({ user: null, status: 'idle' });
      useAuthStore.getState().hydrate();
      expect(useAuthStore.getState().status).toBe('unauthenticated');
    });

    it('drops expired Google tokens', async () => {
      const { useAuthStore } = await import('./useAuthStore');
      useAuthStore.setState({
        user: {
          email: 'g@google.com',
          displayName: 'G',
          provider: 'google',
          idToken: 'old-token',
          expiresAt: Date.now() - 1000, // already expired
        },
        status: 'authenticated',
      });
      useAuthStore.getState().hydrate();
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().status).toBe('unauthenticated');
    });

    it('keeps valid Google tokens', async () => {
      const { useAuthStore } = await import('./useAuthStore');
      useAuthStore.setState({
        user: {
          email: 'g@google.com',
          displayName: 'G',
          provider: 'google',
          idToken: 'valid-token',
          expiresAt: Date.now() + 60 * 60 * 1000,
        },
        status: 'unauthenticated',
      });
      useAuthStore.getState().hydrate();
      expect(useAuthStore.getState().status).toBe('authenticated');
    });
  });

<<<<<<< HEAD
=======
  describe('clearError', () => {
    it('sets error to null', async () => {
      const { useAuthStore } = await import('./useAuthStore');
      useAuthStore.setState({ error: 'some error' });
      useAuthStore.getState().clearError();
      expect(useAuthStore.getState().error).toBeNull();
    });
  });

>>>>>>> feat/FEAT-20260516-01-expense-tracking
  describe('setSession', () => {
    it('sets user, status=authenticated and clears error', async () => {
      const { useAuthStore } = await import('./useAuthStore');
      useAuthStore.setState({ user: null, status: 'unauthenticated', error: 'prev error' });
      const session = {
        email: 'test@example.com',
        displayName: 'Test User',
        provider: 'google' as const,
        idToken: 'tok',
        expiresAt: Date.now() + 3600 * 1000,
      };
      useAuthStore.getState().setSession(session);
      const state = useAuthStore.getState();
      expect(state.status).toBe('authenticated');
      expect(state.user).toEqual(session);
      expect(state.error).toBeNull();
    });
  });
});
