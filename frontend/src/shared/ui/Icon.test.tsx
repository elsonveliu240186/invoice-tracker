import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Eye, Star, X } from 'lucide-react';
import { Icon } from './Icon';

describe('Icon', () => {
  it('renders the given Lucide icon component', () => {
    render(<Icon as={Eye} aria-hidden={false} aria-label="eye icon" />);
    // Lucide renders an <svg> element
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('is aria-hidden by default', () => {
    render(<Icon as={Eye} />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('respects ariaHidden=false when explicitly set', () => {
    render(<Icon as={Eye} ariaHidden={false} aria-label="show password" />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'false');
  });

  it('applies xs size class (h-3 w-3)', () => {
    render(<Icon as={Star} size="xs" />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveClass('h-3', 'w-3');
  });

  it('applies sm size class by default (h-4 w-4)', () => {
    render(<Icon as={Star} />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveClass('h-4', 'w-4');
  });

  it('applies md size class (h-5 w-5)', () => {
    render(<Icon as={Star} size="md" />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveClass('h-5', 'w-5');
  });

  it('applies lg size class (h-6 w-6)', () => {
    render(<Icon as={Star} size="lg" />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveClass('h-6', 'w-6');
  });

  it('merges additional className with size classes', () => {
    render(<Icon as={X} size="sm" className="opacity-50" />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveClass('h-4', 'w-4', 'opacity-50');
  });

  it('forwards additional Lucide props (e.g. strokeWidth)', () => {
    render(<Icon as={Eye} strokeWidth={3} />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('stroke-width', '3');
  });
});
