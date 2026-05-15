import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { PaletteToggle } from './PaletteToggle';
import { usePaletteStore } from '@/shared/theme/paletteStore';

beforeEach(() => {
  usePaletteStore.setState({ palette: 'navy-amber' });
  document.documentElement.classList.remove('palette-teal-steel');
  localStorage.clear();
});

describe('PaletteToggle', () => {
  it('renders the palette toggle trigger button', () => {
    render(<PaletteToggle />);
    expect(screen.getByRole('button', { name: /switch palette/i })).toBeInTheDocument();
  });

  it('opens dropdown and shows both palette names on click', async () => {
    const user = userEvent.setup();
    render(<PaletteToggle />);
    await user.click(screen.getByRole('button', { name: /switch palette/i }));
    await waitFor(() => {
      expect(screen.getByText('Navy & Amber')).toBeInTheDocument();
      expect(screen.getByText('Teal & Steel')).toBeInTheDocument();
    });
  });

  it('selecting Teal & Steel changes the palette store value', async () => {
    const user = userEvent.setup();
    render(<PaletteToggle />);
    await user.click(screen.getByRole('button', { name: /switch palette/i }));
    await waitFor(() => expect(screen.getByText('Teal & Steel')).toBeInTheDocument());
    await user.click(screen.getByText('Teal & Steel'));
    expect(usePaletteStore.getState().palette).toBe('teal-steel');
  });

  it('selecting Navy & Amber keeps the palette store as navy-amber', async () => {
    usePaletteStore.setState({ palette: 'teal-steel' });
    const user = userEvent.setup();
    render(<PaletteToggle />);
    await user.click(screen.getByRole('button', { name: /switch palette/i }));
    await waitFor(() => expect(screen.getByText('Navy & Amber')).toBeInTheDocument());
    await user.click(screen.getByText('Navy & Amber'));
    expect(usePaletteStore.getState().palette).toBe('navy-amber');
  });
});
