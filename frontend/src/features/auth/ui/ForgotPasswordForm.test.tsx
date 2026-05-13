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
  const { ForgotPasswordForm } = await import('./ForgotPasswordForm');
  return render(
    <MemoryRouter initialEntries={['/forgot-password']}>
      <I18nextProvider i18n={i18n}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPasswordForm />} />
          <Route path="/login" element={<p>Login page</p>} />
        </Routes>
      </I18nextProvider>
    </MemoryRouter>,
  );
}

describe('ForgotPasswordForm', () => {
  it('renders the email field', async () => {
    await renderForm();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('shows validation error on empty submit', async () => {
    const user = userEvent.setup();
    await renderForm();
    await user.click(screen.getByRole('button', { name: /send reset link/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });

  it('shows generic success toast on valid email (anti-enumeration)', async () => {
    server.use(
      mswHttp.post('/api/v1/auth/forgot-password', () => new HttpResponse(null, { status: 204 })),
    );
    const { toast } = await import('sonner');
    const user = userEvent.setup();
    await renderForm();
    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });

  it('shows the same generic success toast even when server returns 500 (anti-enumeration)', async () => {
    server.use(
      mswHttp.post('/api/v1/auth/forgot-password', () => new HttpResponse(null, { status: 500 })),
    );
    const { toast } = await import('sonner');
    const user = userEvent.setup();
    await renderForm();
    await user.type(screen.getByLabelText(/email/i), 'unknown@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });

  it('renders a back-to-sign-in link', async () => {
    await renderForm();
    expect(screen.getByRole('link', { name: /back to sign in/i })).toBeInTheDocument();
  });
});
