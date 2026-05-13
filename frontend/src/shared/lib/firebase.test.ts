import { describe, it, expect, vi, beforeEach } from 'vitest';

// We mock the entire firebase/app module so no real network calls happen.
vi.mock('firebase/app', () => {
  const apps: unknown[] = [];
  const mockApp = { name: '[DEFAULT]' };
  return {
    initializeApp: vi.fn(() => {
      apps.push(mockApp);
      return mockApp;
    }),
    getApps: vi.fn(() => apps),
  };
});

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ currentUser: null })),
}));

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
});

describe('firebase singleton', () => {
  it('throws a clear error when VITE_FIREBASE_API_KEY is missing', async () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', '');
    const { getFirebaseApp } = await import('./firebase');
    expect(() => getFirebaseApp()).toThrow('VITE_FIREBASE_API_KEY is not set');
  });

  it('initialises and returns the same app instance (memoises)', async () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-key');
    vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'test.firebaseapp.com');
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project');

    const { getFirebaseApp, _resetFirebaseSingletons } = await import('./firebase');
    _resetFirebaseSingletons();

    const app1 = getFirebaseApp();
    const app2 = getFirebaseApp();
    expect(app1).toBe(app2);
  });

  it('returns a Firebase Auth instance from getFirebaseAuth', async () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-key');
    vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'test.firebaseapp.com');

    const { getFirebaseAuth, _resetFirebaseSingletons } = await import('./firebase');
    _resetFirebaseSingletons();

    const auth = getFirebaseAuth();
    expect(auth).toBeDefined();
  });

  it('memoises the auth instance across calls', async () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-key');
    const { getFirebaseAuth, _resetFirebaseSingletons } = await import('./firebase');
    _resetFirebaseSingletons();

    const auth1 = getFirebaseAuth();
    const auth2 = getFirebaseAuth();
    expect(auth1).toBe(auth2);
  });
});
