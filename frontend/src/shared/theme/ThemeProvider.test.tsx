import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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
  vi.restoreAllMocks();
});

describe('ThemeProvider', () => {
  it('mounts without errors and renders children', async () => {
    const { ThemeProvider } = await import('./ThemeProvider');
    const { getByText } = render(
      <ThemeProvider>
        <span>child content</span>
      </ThemeProvider>,
    );
    expect(getByText('child content')).toBeInTheDocument();
  });

  it('initialises the media listener on mount', async () => {
    const addEventListenerSpy = vi.fn();
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: addEventListenerSpy,
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    vi.resetModules();

    const { ThemeProvider } = await import('./ThemeProvider');
    render(
      <ThemeProvider>
        <span>child</span>
      </ThemeProvider>,
    );
    expect(addEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('applies persisted dark theme on mount', async () => {
    // Persist dark theme in localStorage
    localStorage.setItem('it.theme', JSON.stringify({ state: { theme: 'dark' }, version: 0 }));
    vi.resetModules();

    const { useThemeStore } = await import('./themeStore');
    useThemeStore.getState().setTheme('dark');

    const { ThemeProvider } = await import('./ThemeProvider');
    render(
      <ThemeProvider>
        <span>child</span>
      </ThemeProvider>,
    );
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('removes media listener on unmount', async () => {
    const removeEventListenerSpy = vi.fn();
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: removeEventListenerSpy,
      dispatchEvent: vi.fn(),
    }));
    vi.resetModules();

    const { ThemeProvider } = await import('./ThemeProvider');
    const { unmount } = render(
      <ThemeProvider>
        <span>child</span>
      </ThemeProvider>,
    );
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalled();
  });
});
