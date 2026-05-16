import { useEffect, type ReactNode } from 'react';
import { useThemeStore } from './themeStore';

interface ThemeProviderProps {
  children: ReactNode;
}

function disposeMediaListener() {
  useThemeStore.getState()._mediaCleanup?.();
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  useEffect(() => {
    useThemeStore.getState()._initMediaListener();
    return disposeMediaListener;
  }, []);

  return <>{children}</>;
}
