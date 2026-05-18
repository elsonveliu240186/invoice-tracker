import '@testing-library/jest-dom/vitest';
import { afterEach, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './mocks/server';

// ── URL.createObjectURL / revokeObjectURL stubs ───────────────────────────────
// jsdom does not implement these; without them vi.spyOn(URL, 'createObjectURL') throws.
if (typeof URL.createObjectURL === 'undefined') {
  Object.defineProperty(URL, 'createObjectURL', {
    writable: true,
    configurable: true,
    value: (_blob: Blob) => 'blob:mock-url',
  });
}
if (typeof URL.revokeObjectURL === 'undefined') {
  Object.defineProperty(URL, 'revokeObjectURL', {
    writable: true,
    configurable: true,
    value: (_url: string) => undefined,
  });
}

// ── Clipboard API stub ───────────────────────────────────────────────────────
// jsdom does not implement navigator.clipboard; define a configurable stub so
// individual tests can spy on writeText without Object.defineProperty failures.
// Use try/catch: if the property is non-configurable in this jsdom version,
// fall back to a direct assignment via Object.assign.
try {
  Object.defineProperty(navigator, 'clipboard', {
    writable: true,
    configurable: true,
    value: {
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue(''),
    },
  });
} catch {
  (navigator as unknown as Record<string, unknown>)['clipboard'] = {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  };
}

// ── ResizeObserver stub ───────────────────────────────────────────────────────
// Radix UI Popover (and similar Popper-based primitives) use ResizeObserver to
// track trigger/content size changes. jsdom does not include it; add a no-op stub.
if (typeof window.ResizeObserver === 'undefined') {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// ── PointerEvent polyfill ─────────────────────────────────────────────────────
// Radix UI Popover (and similar primitives) rely on PointerEvent to open/close.
// jsdom does not include PointerEvent; add a minimal stub so that pointer-based
// interactions like userEvent.click work correctly in tests.
if (typeof window.PointerEvent === 'undefined') {
  class PointerEvent extends MouseEvent {
    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
    }
  }
  Object.defineProperty(window, 'PointerEvent', {
    writable: true,
    configurable: true,
    value: PointerEvent,
  });
}

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
