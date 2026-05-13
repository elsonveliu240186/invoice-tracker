import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

type MediaChangeHandler = (e: { matches: boolean }) => void;

// We need to reset the module between tests to get a fresh store
beforeEach(() => {
  vi.resetModules();
  // Clear localStorage
  localStorage.clear();
  // Reset html class
  document.documentElement.classList.remove('dark');
  // Mock matchMedia default: light mode
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

describe('useThemeStore', () => {
  it('defaults to system theme', async () => {
    const { useThemeStore } = await import('./themeStore');
    expect(useThemeStore.getState().theme).toBe('system');
  });

  it('setTheme("dark") adds .dark class to html', async () => {
    const { useThemeStore } = await import('./themeStore');
    useThemeStore.getState().setTheme('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(useThemeStore.getState().resolved).toBe('dark');
  });

  it('setTheme("light") removes .dark class from html', async () => {
    document.documentElement.classList.add('dark');
    const { useThemeStore } = await import('./themeStore');
    useThemeStore.getState().setTheme('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(useThemeStore.getState().resolved).toBe('light');
  });

  it('setTheme("system") resolves to light when OS is light', async () => {
    const { useThemeStore } = await import('./themeStore');
    useThemeStore.getState().setTheme('system');
    expect(useThemeStore.getState().resolved).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('setTheme("system") resolves to dark when OS is dark', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    vi.resetModules();
    const { useThemeStore } = await import('./themeStore');
    useThemeStore.getState().setTheme('system');
    expect(useThemeStore.getState().resolved).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('toggleTheme cycles light->dark->system->light', async () => {
    const { useThemeStore } = await import('./themeStore');
    useThemeStore.getState().setTheme('light');
    expect(useThemeStore.getState().theme).toBe('light');

    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('dark');

    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('system');

    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('light');
  });

  it('media listener updates resolved when theme is system', async () => {
    const captured: { handler: MediaChangeHandler | null } = { handler: null };
    const mockMq = {
      matches: false,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((_event: string, handler: MediaChangeHandler) => {
        captured.handler = handler;
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
    vi.stubGlobal('matchMedia', () => mockMq);
    vi.resetModules();

    const { useThemeStore } = await import('./themeStore');
    useThemeStore.getState().setTheme('system');
    useThemeStore.getState()._initMediaListener();

    // Simulate OS switching to dark
    mockMq.matches = true;
    captured.handler?.({ matches: true });

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('media listener does NOT update when theme is not system', async () => {
    const captured: { handler: MediaChangeHandler | null } = { handler: null };
    const mockMq = {
      matches: false,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((_event: string, handler: MediaChangeHandler) => {
        captured.handler = handler;
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
    vi.stubGlobal('matchMedia', () => mockMq);
    vi.resetModules();

    const { useThemeStore } = await import('./themeStore');
    useThemeStore.getState().setTheme('dark');
    useThemeStore.getState()._initMediaListener();

    // Simulate OS switching to light — should NOT affect resolved since theme is 'dark'
    mockMq.matches = false;
    captured.handler?.({ matches: false });

    expect(useThemeStore.getState().resolved).toBe('dark');
  });

  it('_initMediaListener cleans up previous listener before registering new one', async () => {
    const removeListener = vi.fn();
    const mockMq = {
      matches: false,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: removeListener,
      dispatchEvent: vi.fn(),
    };
    vi.stubGlobal('matchMedia', () => mockMq);
    vi.resetModules();

    const { useThemeStore } = await import('./themeStore');
    useThemeStore.getState()._initMediaListener();
    useThemeStore.getState()._initMediaListener();

    expect(removeListener).toHaveBeenCalled();
  });
});
