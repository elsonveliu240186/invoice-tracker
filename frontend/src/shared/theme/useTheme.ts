import { useShallow } from 'zustand/react/shallow';
import { useThemeStore } from './themeStore';

export function useTheme() {
  return useThemeStore(
    useShallow((s) => ({
      theme: s.theme,
      resolved: s.resolved,
      setTheme: s.setTheme,
      toggle: s.toggleTheme,
    })),
  );
}
