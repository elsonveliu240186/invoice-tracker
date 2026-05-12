import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/lib/i18n';

vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: vi.fn(() => ({})),
  signInWithPopup: vi.fn(),
}));
vi.mock('@/shared/lib/firebase', () => ({
  getFirebaseAuth: vi.fn(() => ({})),
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

beforeEach(async () => {
  vi.resetModules();
  localStorage.clear();
  document.documentElement.classList.remove('dark');
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

async function renderTopNav(props: { onMenuClick?: () => void; children?: React.ReactNode } = {}) {
  const { TopNav } = await import('./TopNav');
  return render(
    <MemoryRouter initialEntries={['/']}>
      <I18nextProvider i18n={i18n}>
        <Routes>
          <Route path="/" element={<TopNav {...props} />} />
          <Route path="/login" element={<p data-testid="login-page">Login</p>} />
        </Routes>
      </I18nextProvider>
    </MemoryRouter>,
  );
}

describe('TopNav', () => {
  it('renders the hamburger button', async () => {
    await renderTopNav();
    expect(screen.getByTestId('hamburger')).toBeInTheDocument();
  });

  it('hamburger emits onMenuClick when clicked', async () => {
    const user = userEvent.setup();
    const onMenuClick = vi.fn();
    await renderTopNav({ onMenuClick });
    await user.click(screen.getByTestId('hamburger'));
    expect(onMenuClick).toHaveBeenCalledTimes(1);
  });

  it('renders LanguageSelector button', async () => {
    await renderTopNav();
    expect(screen.getByRole('button', { name: /language/i })).toBeInTheDocument();
  });

  it('renders ThemeToggle button', async () => {
    await renderTopNav();
    expect(screen.getByRole('button', { name: /theme/i })).toBeInTheDocument();
  });

  it('renders Avatar with app initials when no user', async () => {
    await renderTopNav();
    expect(screen.getByText('IN')).toBeInTheDocument();
  });

  it('renders Avatar with user initials when authenticated', async () => {
    const { useAuthStore } = await import('@/features/auth/model/useAuthStore');
    useAuthStore.setState({
      user: { email: 'u@e.com', displayName: 'Alice Smith', provider: 'password' },
      status: 'authenticated',
    });
    await renderTopNav();
    expect(screen.getByText('AL')).toBeInTheDocument();
  });

  it('renders children in breadcrumb slot', async () => {
    await renderTopNav({ children: <span data-testid="breadcrumb">Home</span> });
    expect(screen.getByTestId('breadcrumb')).toBeInTheDocument();
  });

  it('sign out clears auth store and redirects to /login', async () => {
    const { useAuthStore } = await import('@/features/auth/model/useAuthStore');
    useAuthStore.setState({
      user: { email: 'u@e.com', displayName: 'Alice', provider: 'password' },
      status: 'authenticated',
    });
    const user = userEvent.setup();
    await renderTopNav();
    await user.click(screen.getByTestId('user-menu-trigger'));
    await waitFor(() => expect(screen.getByTestId('sign-out-item')).toBeInTheDocument());
    await user.click(screen.getByTestId('sign-out-item'));
    await waitFor(() => expect(screen.getByTestId('login-page')).toBeInTheDocument());
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().status).toBe('unauthenticated');
  });
});
