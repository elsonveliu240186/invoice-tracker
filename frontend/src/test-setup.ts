import '@testing-library/jest-dom/vitest';
import { afterEach, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './mocks/server';

// ── matchMedia global stub ────────────────────────────────────────────────────
// motion.ts calls window.matchMedia at module-evaluation time (for prefersReducedMotion).
// We must stub it before any test file imports a component that depends on motion.ts.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

// ── MSW ───────────────────────────────────────────────────────────────────────
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());

// ── localStorage reset per test ───────────────────────────────────────────────
beforeEach(() => {
  localStorage.clear();
});

// ── Global Firebase auth mock ─────────────────────────────────────────────────
// Tests that import firebase/auth directly use this default mock.
// Individual test files that need to control outcomes use vi.mock() locally
// with __setSignInResult / __setSignInError helpers.
vi.mock('firebase/app', () => {
  const apps: unknown[] = [];
  const mockApp = { name: '[DEFAULT]' };
  return {
    initializeApp: vi.fn(() => {
      apps.push(mockApp);
      return mockApp;
    }),
    getApps: vi.fn(() => [...apps]),
  };
});

vi.mock('firebase/auth', () => {
  let _result: Record<string, unknown> | null = {
    user: {
      email: 'google@example.com',
      displayName: 'Google User',
      getIdToken: () => Promise.resolve('mock-id-token'),
    },
  };
  let _error: Error | null = null;

  return {
    GoogleAuthProvider: vi.fn().mockImplementation(() => ({})),
    signInWithPopup: vi.fn(() => {
      if (_error) return Promise.reject(_error);
      return Promise.resolve(_result);
    }),
    getAuth: vi.fn(() => ({ currentUser: null })),
    __setSignInResult: (r: Record<string, unknown>) => {
      _result = r;
      _error = null;
    },
    __setSignInError: (e: Error) => {
      _error = e;
      _result = null;
    },
  };
});
