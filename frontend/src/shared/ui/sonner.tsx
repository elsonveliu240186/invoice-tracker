import { Toaster as SonnerToaster } from 'sonner';
import { useThemeStore } from '@/shared/theme/themeStore';

export function Toaster() {
  const resolved = useThemeStore((s) => s.resolved);
  return <SonnerToaster theme={resolved} richColors />;
}
