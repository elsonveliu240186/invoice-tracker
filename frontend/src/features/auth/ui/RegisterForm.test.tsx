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
  signInWithPopup: vi.fn(),
}));
vi.mock('@/shared/lib/firebase', () => ({
  getFirebaseAuth: vi.fn(() => ({})),
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

beforeEach(async () => {
  vi.clearAllMocks();
  localStorage.clear();
  const { useAuthStore } = await import('../model/useAuthStore');
  useAuthStore.setState({ user: null, status: 'unauthenticated', error: null });
});

async function renderForm() {
  const { RegisterForm } = await import('./RegisterForm');
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <I18nextProvider i18n={i18n}>
        <Routes>
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/login" element={<p>Login page</p>} />
        </Routes>
      </I18nextProvider>
    </MemoryRouter>,
  );
}

describe('RegisterForm', () => {
  it('renders name, email, password, and confirm password fields', async () => {
    await renderForm();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it('shows validation error when passwords do not match', async () => {
    const user = userEvent.setup();
    await renderForm();
    await user.type(screen.getByLabelText(/full name/i), 'Alice');
    await user.type(screen.getByLabelText(/^email/i), 'alice@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Password1');
    await user.type(screen.getByLabelText(/confirm password/i), 'Different1');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      expect(alerts.some((a) => a.textContent?.toLowerCase().includes('match'))).toBe(true);
    });
  });

  it('blocks submit when confirm-password mismatch', async () => {
    const user = userEvent.setup();
    await renderForm();
    await user.type(screen.getByLabelText(/full name/i), 'Bob');
    await user.type(screen.getByLabelText(/^email/i), 'bob@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Password1');
    await user.type(screen.getByLabelText(/confirm password/i), 'Wrong1234');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    // Should not navigate away
    await waitFor(() => expect(screen.queryByText('Login page')).not.toBeInTheDocument());
  });

  it('redirects to /login with success toast on successful registration', async () => {
    server.use(
      mswHttp.post('/api/v1/auth/register', () =>
        HttpResponse.json({ email: 'new@example.com', displayName: 'Alice' }, { status: 201 }),
      ),
    );
    const { toast } = await import('sonner');
    const user = userEvent.setup();
    await renderForm();
    await user.type(screen.getByLabelText(/full name/i), 'Alice');
    await user.type(screen.getByLabelText(/^email/i), 'new@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Password1');
    await user.type(screen.getByLabelText(/confirm password/i), 'Password1');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => expect(screen.getByText('Login page')).toBeInTheDocument());
    expect(toast.success).toHaveBeenCalled();
  });

  it('shows email-taken toast on 409 conflict', async () => {
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
    await renderForm();
    await user.type(screen.getByLabelText(/full name/i), 'Alice');
    await user.type(screen.getByLabelText(/^email/i), 'dup@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Password1');
    await user.type(screen.getByLabelText(/confirm password/i), 'Password1');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });

  it('renders a link back to /login', async () => {
    await renderForm();
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
  });
});
