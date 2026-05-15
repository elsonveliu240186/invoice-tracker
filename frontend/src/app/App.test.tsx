import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/lib/i18n';
import { useAuthStore } from '@/features/auth/model/useAuthStore';
import { resetMockClients, resetMockInvoices } from '@/mocks/handlers';
import { App } from './App';

beforeEach(() => {
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
  useAuthStore.setState({ user: null, status: 'unauthenticated', error: null });
  resetMockClients();
  resetMockInvoices();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderApp(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>
    </MemoryRouter>,
  );
}

function renderAppAuthenticated(initialPath = '/') {
  useAuthStore.setState({
    user: { email: 'u@e.com', displayName: 'Alice', provider: 'password' },
    status: 'authenticated',
  });
  return renderApp(initialPath);
}

describe('App — unauthenticated', () => {
  it('redirects unauthenticated user from / to /login', () => {
    renderApp('/');
    expect(screen.getByTestId('brand-panel')).toBeInTheDocument();
  });

  it('redirects unauthenticated user from /clients to /login', () => {
    renderApp('/clients');
    expect(screen.getByTestId('brand-panel')).toBeInTheDocument();
  });

  it('renders login page at /login when unauthenticated', () => {
    renderApp('/login');
    expect(screen.getByTestId('brand-panel')).toBeInTheDocument();
  });

  it('renders register page at /register when unauthenticated', () => {
    renderApp('/register');
    expect(screen.getByTestId('brand-panel')).toBeInTheDocument();
  });

  it('renders forgot-password page at /forgot-password when unauthenticated', () => {
    renderApp('/forgot-password');
    expect(screen.getByTestId('brand-panel')).toBeInTheDocument();
  });
});

describe('App — authenticated', () => {
  it('renders dashboard page at / when authenticated', async () => {
    renderAppAuthenticated('/');
    await waitFor(() => expect(screen.getByTestId('dashboard-page')).toBeInTheDocument());
  });

  it('renders clients page at /clients when authenticated', async () => {
    renderAppAuthenticated('/clients');
    await waitFor(() => {
      expect(screen.getByTestId('clients-page')).toBeInTheDocument();
    });
  });

  it('renders client detail page at /clients/:id when authenticated', async () => {
    renderAppAuthenticated('/clients/uuid-1');
    await waitFor(() => {
      expect(
        screen.getByTestId('client-detail-loading') ||
          screen.getByTestId('client-detail-page') ||
          screen.getByTestId('client-detail-not-found'),
      ).toBeInTheDocument();
    });
  });

  it('redirects authenticated user from /login to /', async () => {
    renderAppAuthenticated('/login');
    await waitFor(() => expect(screen.getByTestId('dashboard-page')).toBeInTheDocument());
  });

  it('redirects authenticated user from /register to /', async () => {
    renderAppAuthenticated('/register');
    await waitFor(() => expect(screen.getByTestId('dashboard-page')).toBeInTheDocument());
  });

  it('renders invoice detail page at /invoices/:id when authenticated', async () => {
    renderAppAuthenticated('/invoices/inv-uuid-1');
    await waitFor(() => {
      expect(
        screen.getByTestId('invoice-detail-loading') ||
          screen.getByTestId('invoice-detail-page') ||
          screen.getByTestId('invoice-detail-not-found'),
      ).toBeInTheDocument();
    });
  });

  it('renders invoice template settings page at /settings/invoice-template when authenticated', async () => {
    renderAppAuthenticated('/settings/invoice-template');
    await waitFor(() => {
      expect(screen.getByTestId('invoice-template-settings-page')).toBeInTheDocument();
    });
  });

  it('renders 404 empty state for unknown protected routes', () => {
    renderAppAuthenticated('/unknown-route');
    expect(screen.getByText('Page not found')).toBeInTheDocument();
  });

  it('renders the AppShell nav when authenticated', async () => {
    renderAppAuthenticated('/');
    await waitFor(() =>
      expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument(),
    );
  });
});
