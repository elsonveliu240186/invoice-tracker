import { useEffect, type ReactNode } from 'react';
import { useThemeStore } from './themeStore';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  useEffect(() => {
    const state = useThemeStore.getState();
    state._initMediaListener();

    return () => {
      const cleanup = useThemeStore.getState()._mediaCleanup;
      if (cleanup) cleanup();
    };
  }, []);

  return <>{children}</>;
}
