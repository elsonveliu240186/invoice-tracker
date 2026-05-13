import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

async function renderToggle() {
  const { ThemeToggle } = await import('./ThemeToggle');
  return render(
    <I18nextProvider i18n={i18n}>
      <ThemeToggle />
    </I18nextProvider>,
  );
}

describe('ThemeToggle', () => {
  it('renders a button with aria-label Theme', async () => {
    await renderToggle();
    expect(screen.getByRole('button', { name: /theme/i })).toBeInTheDocument();
  });

  it('opens dropdown menu on click', async () => {
    const user = userEvent.setup();
    await renderToggle();
    await user.click(screen.getByRole('button', { name: /theme/i }));
    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
  });

  it('calls setTheme with dark when Dark is selected', async () => {
    const user = userEvent.setup();
    await renderToggle();
    await user.click(screen.getByRole('button', { name: /theme/i }));
    await user.click(screen.getByText('Dark'));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('calls setTheme with light when Light is selected', async () => {
    const user = userEvent.setup();
    // Start from dark
    const { useThemeStore } = await import('@/shared/theme/themeStore');
    useThemeStore.getState().setTheme('dark');

    await renderToggle();
    await user.click(screen.getByRole('button', { name: /theme/i }));
    await user.click(screen.getByText('Light'));
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('shows check mark next to active theme', async () => {
    const user = userEvent.setup();
    const { useThemeStore } = await import('@/shared/theme/themeStore');
    useThemeStore.getState().setTheme('dark');

    await renderToggle();
    await user.click(screen.getByRole('button', { name: /theme/i }));

    // The Dark item row should have a check (lucide Check renders as svg)
    const darkItem = screen.getByText('Dark').closest('[role="menuitem"]');
    expect(darkItem?.querySelector('svg')).toBeTruthy();
  });
});
