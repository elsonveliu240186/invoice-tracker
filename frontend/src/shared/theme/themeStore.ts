import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  resolved: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  _mediaCleanup: (() => void) | null;
  _initMediaListener: () => void;
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }
  return theme;
}

function applyTheme(resolved: 'light' | 'dark') {
  if (typeof document !== 'undefined') {
    if (resolved === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}

const themeOrder: Theme[] = ['light', 'dark', 'system'];

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolved: 'light',
      _mediaCleanup: null,

      setTheme: (theme: Theme) => {
        const resolved = resolveTheme(theme);
        applyTheme(resolved);
        set({ theme, resolved });
      },

      toggleTheme: () => {
        const { theme } = get();
        const currentIndex = themeOrder.indexOf(theme);
        const nextTheme = themeOrder[(currentIndex + 1) % themeOrder.length] ?? 'light';
        get().setTheme(nextTheme);
      },

      _initMediaListener: () => {
        const { _mediaCleanup } = get();
        if (_mediaCleanup) _mediaCleanup();

        if (typeof window === 'undefined') return;

        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = () => {
          const { theme } = get();
          if (theme === 'system') {
            const resolved = resolveTheme('system');
            applyTheme(resolved);
            set({ resolved });
          }
        };

        mq.addEventListener('change', handler);
        set({ _mediaCleanup: () => mq.removeEventListener('change', handler) });
      },
    }),
    {
      name: 'it.theme',
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const resolved = resolveTheme(state.theme);
          applyTheme(resolved);
          state.resolved = resolved;
        }
      },
    },
  ),
);
