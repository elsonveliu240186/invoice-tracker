import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/lib/i18n';
import { AppShell } from './AppShell';
import { useAuthStore } from '@/features/auth/model/useAuthStore';

vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: vi.fn(() => ({})),
  signInWithPopup: vi.fn(),
}));
vi.mock('@/shared/lib/firebase', () => ({
  getFirebaseAuth: vi.fn(() => ({})),
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

// Store the matchMedia mock so tests can simulate mobile vs desktop
let isMobileMatch = false;
const mediaListeners: Array<(e: { matches: boolean }) => void> = [];

function setupMatchMedia(mobile: boolean) {
  isMobileMatch = mobile;
  vi.stubGlobal('matchMedia', (query: string) => {
    const matches = query === '(max-width: 1023px)' ? isMobileMatch : false;
    return {
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((_: string, fn: (e: { matches: boolean }) => void) => {
        if (query === '(max-width: 1023px)') mediaListeners.push(fn);
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
  });
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('dark');
  mediaListeners.length = 0;
  setupMatchMedia(false);
  useAuthStore.setState({ user: null, status: 'unauthenticated', error: null });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderShell() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <I18nextProvider i18n={i18n}>
        <Routes>
          <Route
            path="/"
            element={
              <AppShell>
                <div data-testid="outlet-content">Page content</div>
              </AppShell>
            }
          />
          <Route path="/login" element={<p data-testid="login-page">Login</p>} />
        </Routes>
      </I18nextProvider>
    </MemoryRouter>,
  );
}

function renderShellMobile() {
  setupMatchMedia(true);
  return render(
    <MemoryRouter initialEntries={['/']}>
      <I18nextProvider i18n={i18n}>
        <Routes>
          <Route
            path="/"
            element={
              <AppShell>
                <div data-testid="outlet-content">Page content</div>
              </AppShell>
            }
          />
          <Route path="/login" element={<p data-testid="login-page">Login</p>} />
        </Routes>
      </I18nextProvider>
    </MemoryRouter>,
  );
}

describe('AppShell', () => {
  it('renders desktop sidebar on large screens', () => {
    renderShell();
    expect(screen.getByTestId('desktop-sidebar')).toBeInTheDocument();
  });

  it('renders TopNav', () => {
    renderShell();
    expect(screen.getByTestId('hamburger')).toBeInTheDocument();
  });

  it('renders outlet/children content', () => {
    renderShell();
    expect(screen.getByTestId('outlet-content')).toBeInTheDocument();
  });

  it('does not show desktop sidebar on mobile', () => {
    renderShellMobile();
    expect(screen.queryByTestId('desktop-sidebar')).not.toBeInTheDocument();
  });

  it('does not show drawer initially on mobile', () => {
    renderShellMobile();
    expect(screen.queryByTestId('drawer-overlay')).not.toBeInTheDocument();
  });

  it('opens drawer when hamburger is clicked on mobile', async () => {
    const user = userEvent.setup();
    renderShellMobile();
    await user.click(screen.getByTestId('hamburger'));
    expect(screen.getByTestId('drawer-overlay')).toBeInTheDocument();
  });

  it('closes drawer when backdrop is clicked', async () => {
    const user = userEvent.setup();
    renderShellMobile();
    await user.click(screen.getByTestId('hamburger'));
    expect(screen.getByTestId('drawer-overlay')).toBeInTheDocument();
    await user.click(screen.getByTestId('drawer-backdrop'));
    await waitFor(() => {
      expect(screen.queryByTestId('drawer-overlay')).not.toBeInTheDocument();
    });
  });

  it('closes drawer when Escape is pressed', async () => {
    const user = userEvent.setup();
    renderShellMobile();
    await user.click(screen.getByTestId('hamburger'));
    expect(screen.getByTestId('drawer-overlay')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByTestId('drawer-overlay')).not.toBeInTheDocument();
    });
  });

  it('closes drawer when sidebar close button is clicked', async () => {
    const user = userEvent.setup();
    renderShellMobile();
    await user.click(screen.getByTestId('hamburger'));
    expect(screen.getByTestId('drawer-overlay')).toBeInTheDocument();
    await user.click(screen.getByTestId('sidebar-close'));
    await waitFor(() => {
      expect(screen.queryByTestId('drawer-overlay')).not.toBeInTheDocument();
    });
  });

  it('renders sidebar nav inside drawer when open on mobile', async () => {
    const user = userEvent.setup();
    renderShellMobile();
    await user.click(screen.getByTestId('hamburger'));
    expect(screen.getByTestId('drawer-panel')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
  });
});
