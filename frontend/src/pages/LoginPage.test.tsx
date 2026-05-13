import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/lib/i18n';
import { http as mswHttp, HttpResponse } from 'msw';
import { server } from '@/mocks/server';

vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: vi.fn(() => ({})),
  signInWithPopup: vi.fn(() =>
    Promise.reject(Object.assign(new Error('popup'), { code: 'auth/popup-blocked' })),
  ),
}));
vi.mock('@/shared/lib/firebase', () => ({
  getFirebaseAuth: vi.fn(() => ({})),
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

beforeEach(async () => {
  vi.clearAllMocks();
  localStorage.clear();
  // framer-motion calls window.matchMedia via prefersReducedMotion()
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  const { useAuthStore } = await import('@/features/auth/model/useAuthStore');
  useAuthStore.setState({ user: null, status: 'unauthenticated', error: null });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function renderPage(initialPath = '/login') {
  const { LoginPage } = await import('./LoginPage');
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <I18nextProvider i18n={i18n}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<p data-testid="home">Home</p>} />
          <Route path="/register" element={<p>Register</p>} />
          <Route path="/forgot-password" element={<p>ForgotPw</p>} />
        </Routes>
      </I18nextProvider>
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  it('renders the split layout with brand panel', async () => {
    await renderPage();
    expect(screen.getByTestId('brand-panel')).toBeInTheDocument();
  });

  it('happy path: type credentials → submit → auth store updated → redirect to /', async () => {
    server.use(
      mswHttp.post('/api/v1/auth/login', () =>
        HttpResponse.json({ email: 'user@example.com', displayName: 'Alice' }),
      ),
    );
    const { useAuthStore } = await import('@/features/auth/model/useAuthStore');
    const user = userEvent.setup();
    await renderPage();
    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Password1');
    await user.click(screen.getByRole('button', { name: /sign in$/i }));
    await waitFor(() => expect(screen.getByTestId('home')).toBeInTheDocument());
    expect(useAuthStore.getState().status).toBe('authenticated');
    expect(useAuthStore.getState().user?.email).toBe('user@example.com');
  });

  it('shows error toast on 401 invalid credentials', async () => {
    server.use(
      mswHttp.post('/api/v1/auth/login', () =>
        HttpResponse.json(
          { status: 401, code: 'BAD_CREDENTIALS' },
          { status: 401, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    );
    const { toast } = await import('sonner');
    const user = userEvent.setup();
    await renderPage();
    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /sign in$/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });

  it('shows forgot-password and register links', async () => {
    await renderPage();
    expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create account/i })).toBeInTheDocument();
  });
});
