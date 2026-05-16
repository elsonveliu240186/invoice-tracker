import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ThemeProvider } from './ThemeProvider';
import { useThemeStore } from './themeStore';

// Use static imports only — no vi.resetModules() so V8 tracks one stable module instance

function makeMockMq(
  options: {
    matches?: boolean;
    addSpy?: ReturnType<typeof vi.fn>;
    removeSpy?: ReturnType<typeof vi.fn>;
  } = {},
) {
  return {
    matches: options.matches ?? false,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: options.addSpy ?? vi.fn(),
    removeEventListener: options.removeSpy ?? vi.fn(),
    dispatchEvent: vi.fn(),
  };
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('dark');
  vi.stubGlobal('matchMedia', () => makeMockMq());
  // Reset store to default state
  useThemeStore.setState({ theme: 'system', resolved: 'light', _mediaCleanup: null });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('ThemeProvider', () => {
  it('mounts without errors and renders children', () => {
    const { getByText } = render(
      <ThemeProvider>
        <span>child content</span>
      </ThemeProvider>,
    );
    expect(getByText('child content')).toBeInTheDocument();
  });

  it('initialises the media listener on mount', () => {
    const addEventListenerSpy = vi.fn();
    vi.stubGlobal('matchMedia', () => makeMockMq({ addSpy: addEventListenerSpy }));

    render(
      <ThemeProvider>
        <span>child</span>
      </ThemeProvider>,
    );
    expect(addEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('applies persisted dark theme on mount', () => {
    useThemeStore.getState().setTheme('dark');

    render(
      <ThemeProvider>
        <span>child</span>
      </ThemeProvider>,
    );
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('removes media listener on unmount when _mediaCleanup is set', () => {
    const removeEventListenerSpy = vi.fn();
    vi.stubGlobal('matchMedia', () => makeMockMq({ removeSpy: removeEventListenerSpy }));

    const { unmount } = render(
      <ThemeProvider>
        <span>child</span>
      </ThemeProvider>,
    );
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalled();
  });

  it('unmounts cleanly when _mediaCleanup is null', () => {
    // Ensure _mediaCleanup is null before mount (store reset in beforeEach)
    useThemeStore.setState({ _mediaCleanup: null });

    // Override matchMedia to NOT register cleanup — use a matchMedia that doesn't set up the listener
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(), // doesn't capture handler, so cleanup path runs with null
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { unmount } = render(
      <ThemeProvider>
        <span>bye</span>
      </ThemeProvider>,
    );
    // Manually set _mediaCleanup to null after mount to test the null path
    useThemeStore.setState({ _mediaCleanup: null });
    expect(() => unmount()).not.toThrow();
  });
});
