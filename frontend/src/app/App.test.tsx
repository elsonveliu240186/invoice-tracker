import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/lib/i18n';

beforeEach(() => {
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
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function renderApp(initialPath = '/') {
  const { App } = await import('./App');
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>
    </MemoryRouter>,
  );
}

describe('App', () => {
  it('renders the AppShell nav on the home route', async () => {
    await renderApp('/');
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
  });

  it('renders the home page heading at /', async () => {
    await renderApp('/');
    expect(
      screen.getByRole('heading', { name: /welcome to invoice tracker/i }),
    ).toBeInTheDocument();
  });

  it('renders the clients page at /clients', async () => {
    await renderApp('/clients');
    await waitFor(() => {
      expect(screen.getByTestId('clients-page')).toBeInTheDocument();
    });
  });

  it('renders 404 empty state for unknown routes', async () => {
    await renderApp('/unknown-route');
    expect(screen.getByText('Page not found')).toBeInTheDocument();
  });
});
