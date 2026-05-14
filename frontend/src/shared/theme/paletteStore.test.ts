import { describe, it, expect, beforeEach } from 'vitest';
import { usePaletteStore } from './paletteStore';

beforeEach(() => {
  usePaletteStore.setState({ palette: 'navy-amber' });
  localStorage.clear();
});

describe('usePaletteStore', () => {
  it('defaults to navy-amber palette', () => {
    expect(usePaletteStore.getState().palette).toBe('navy-amber');
  });

  it('setPalette updates the palette to teal-steel', () => {
    usePaletteStore.getState().setPalette('teal-steel');
    expect(usePaletteStore.getState().palette).toBe('teal-steel');
  });

  it('setPalette can switch back to navy-amber', () => {
    usePaletteStore.getState().setPalette('teal-steel');
    usePaletteStore.getState().setPalette('navy-amber');
    expect(usePaletteStore.getState().palette).toBe('navy-amber');
  });
});
