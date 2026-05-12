import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router';
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

async function renderTopNav(props: { onMenuClick?: () => void; children?: React.ReactNode } = {}) {
  const { TopNav } = await import('./TopNav');
  return render(
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>
        <TopNav {...props} />
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

  it('renders Avatar with initials', async () => {
    await renderTopNav();
    // Avatar fallback shows first two chars of appName uppercased = "IN"
    expect(screen.getByText('IN')).toBeInTheDocument();
  });

  it('renders children in breadcrumb slot', async () => {
    await renderTopNav({ children: <span data-testid="breadcrumb">Home</span> });
    expect(screen.getByTestId('breadcrumb')).toBeInTheDocument();
  });
});
