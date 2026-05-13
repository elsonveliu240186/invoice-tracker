import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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

async function renderForm(initialPath = '/login') {
  const { useAuthStore } = await import('../model/useAuthStore');
  useAuthStore.setState({ user: null, status: 'unauthenticated', error: null });
  const { LoginForm } = await import('./LoginForm');
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <I18nextProvider i18n={i18n}>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/" element={<p>Home</p>} />
        </Routes>
      </I18nextProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('LoginForm', () => {
  it('renders email and password fields', async () => {
    await renderForm();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
  });

  it('shows validation error when email is empty', async () => {
    const user = userEvent.setup();
    await renderForm();
    await user.click(screen.getByRole('button', { name: /sign in$/i }));
    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBeGreaterThan(0);
    });
  });

  it('calls login and redirects to / on success', async () => {
    server.use(
      mswHttp.post('/api/v1/auth/login', () =>
        HttpResponse.json({ email: 'user@example.com', displayName: 'Alice' }),
      ),
    );
    const user = userEvent.setup();
    await renderForm();
    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Password1');
    await user.click(screen.getByRole('button', { name: /sign in$/i }));
    await waitFor(() => expect(screen.getByText('Home')).toBeInTheDocument());
  });

  it('shows error toast on 401 invalid credentials', async () => {
    server.use(
      mswHttp.post('/api/v1/auth/login', () =>
        HttpResponse.json(
          { status: 401, code: 'BAD_CREDENTIALS', detail: 'Invalid credentials' },
          { status: 401, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    );
    const { toast } = await import('sonner');
    const user = userEvent.setup();
    await renderForm();
    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /sign in$/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });

  it('disables submit button while pending', async () => {
    let resolve!: () => void;
    server.use(
      mswHttp.post(
        '/api/v1/auth/login',
        () =>
          new Promise<Response>((res) => {
            resolve = () => res(HttpResponse.json({ email: 'u@e.com', displayName: 'U' }));
          }),
      ),
    );
    const user = userEvent.setup();
    await renderForm();
    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Password1');
    await user.click(screen.getByRole('button', { name: /sign in$/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /loading/i })).toBeDisabled());
    resolve();
  });

  it('renders forgot-password and register links', async () => {
    await renderForm();
    expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create account/i })).toBeInTheDocument();
  });
});
