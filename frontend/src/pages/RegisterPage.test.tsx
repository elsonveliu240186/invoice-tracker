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
  signInWithPopup: vi.fn(),
}));
vi.mock('@/shared/lib/firebase', () => ({
  getFirebaseAuth: vi.fn(() => ({})),
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

beforeEach(async () => {
  vi.clearAllMocks();
  localStorage.clear();
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

async function renderPage() {
  const { RegisterPage } = await import('./RegisterPage');
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <I18nextProvider i18n={i18n}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<p data-testid="login-page">Login</p>} />
        </Routes>
      </I18nextProvider>
    </MemoryRouter>,
  );
}

describe('RegisterPage', () => {
  it('renders the split layout with brand panel', async () => {
    await renderPage();
    expect(screen.getByTestId('brand-panel')).toBeInTheDocument();
  });

  it('happy path: fill form → redirect to login with success toast', async () => {
    server.use(
      mswHttp.post('/api/v1/auth/register', () =>
        HttpResponse.json({ email: 'new@example.com', displayName: 'Alice' }, { status: 201 }),
      ),
    );
    const { toast } = await import('sonner');
    const user = userEvent.setup();
    await renderPage();
    await user.type(screen.getByLabelText(/full name/i), 'Alice');
    await user.type(screen.getByLabelText(/^email/i), 'new@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Password1');
    await user.type(screen.getByLabelText(/confirm password/i), 'Password1');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => expect(screen.getByTestId('login-page')).toBeInTheDocument());
    expect(toast.success).toHaveBeenCalled();
  });

  it('shows 409 conflict toast when email is already registered', async () => {
    server.use(
      mswHttp.post('/api/v1/auth/register', () =>
        HttpResponse.json(
          { status: 409, code: 'USER_EMAIL_TAKEN', detail: 'Email taken' },
          { status: 409, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    );
    const { toast } = await import('sonner');
    const user = userEvent.setup();
    await renderPage();
    await user.type(screen.getByLabelText(/full name/i), 'Alice');
    await user.type(screen.getByLabelText(/^email/i), 'dup@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Password1');
    await user.type(screen.getByLabelText(/confirm password/i), 'Password1');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });
});
