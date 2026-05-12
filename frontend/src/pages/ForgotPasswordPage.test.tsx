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
  const { ForgotPasswordPage } = await import('./ForgotPasswordPage');
  return render(
    <MemoryRouter initialEntries={['/forgot-password']}>
      <I18nextProvider i18n={i18n}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/login" element={<p>Login</p>} />
        </Routes>
      </I18nextProvider>
    </MemoryRouter>,
  );
}

describe('ForgotPasswordPage', () => {
  it('renders the split layout with brand panel', async () => {
    await renderPage();
    expect(screen.getByTestId('brand-panel')).toBeInTheDocument();
  });

  it('submits email and shows generic confirmation toast', async () => {
    server.use(
      mswHttp.post('/api/v1/auth/forgot-password', () => new HttpResponse(null, { status: 204 })),
    );
    const { toast } = await import('sonner');
    const user = userEvent.setup();
    await renderPage();
    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });

  it('shows same generic toast regardless of server response (anti-enumeration)', async () => {
    server.use(
      mswHttp.post('/api/v1/auth/forgot-password', () => new HttpResponse(null, { status: 500 })),
    );
    const { toast } = await import('sonner');
    const user = userEvent.setup();
    await renderPage();
    await user.type(screen.getByLabelText(/email/i), 'nobody@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });
});
