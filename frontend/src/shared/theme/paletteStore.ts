import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Palette = 'navy-amber' | 'teal-steel';

interface PaletteState {
  palette: Palette;
  setPalette: (p: Palette) => void;
}

export const usePaletteStore = create<PaletteState>()(
  persist((set) => ({ palette: 'navy-amber', setPalette: (palette) => set({ palette }) }), {
    name: 'invoice-tracker-palette',
  }),
);
