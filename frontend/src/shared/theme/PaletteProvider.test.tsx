import { render } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { PaletteProvider } from './PaletteProvider';
import { usePaletteStore } from './paletteStore';

beforeEach(() => {
  document.documentElement.classList.remove('palette-teal-steel');
  usePaletteStore.setState({ palette: 'navy-amber' });
});

describe('PaletteProvider', () => {
  it('renders children without errors', () => {
    const { getByText } = render(
      <PaletteProvider>
        <span>child</span>
      </PaletteProvider>,
    );
    expect(getByText('child')).toBeInTheDocument();
  });

  it('adds palette-teal-steel class when palette is teal-steel', () => {
    usePaletteStore.setState({ palette: 'teal-steel' });
    render(
      <PaletteProvider>
        <span>child</span>
      </PaletteProvider>,
    );
    expect(document.documentElement.classList.contains('palette-teal-steel')).toBe(true);
  });

  it('removes palette-teal-steel class when palette is navy-amber', () => {
    document.documentElement.classList.add('palette-teal-steel');
    usePaletteStore.setState({ palette: 'navy-amber' });
    render(
      <PaletteProvider>
        <span>child</span>
      </PaletteProvider>,
    );
    expect(document.documentElement.classList.contains('palette-teal-steel')).toBe(false);
  });
});
