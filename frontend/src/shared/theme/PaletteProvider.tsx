import { useEffect } from 'react';
import { usePaletteStore } from './paletteStore';

export function PaletteProvider({ children }: { children: React.ReactNode }) {
  const palette = usePaletteStore((s) => s.palette);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('palette-teal-steel');
    if (palette === 'teal-steel') root.classList.add('palette-teal-steel');
  }, [palette]);

  return <>{children}</>;
}
