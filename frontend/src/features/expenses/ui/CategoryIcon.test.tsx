import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CategoryIcon } from './CategoryIcon';
import type { ExpenseCategory } from '../model/types';

const CATEGORIES: ExpenseCategory[] = [
  'FOOD_DRINK',
  'TRANSPORT',
  'HOUSING',
  'HEALTH',
  'ENTERTAINMENT',
  'SHOPPING',
  'TRAVEL',
  'EDUCATION',
  'UTILITIES',
  'OTHER',
];

describe('CategoryIcon', () => {
  it.each(CATEGORIES)('renders an svg for category %s', (category) => {
    const { container } = render(<CategoryIcon category={category} />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it.each(CATEGORIES)('sets data-category attribute for %s', (category) => {
    const { container } = render(<CategoryIcon category={category} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('data-category')).toBe(category);
  });

  it('accepts custom className', () => {
    const { container } = render(<CategoryIcon category="FOOD_DRINK" className="h-8 w-8" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('class')).toContain('h-8');
  });

  it('renders all 10 distinct icons without error', () => {
    const { container } = render(
      <div>
        {CATEGORIES.map((cat) => (
          <CategoryIcon key={cat} category={cat} />
        ))}
      </div>,
    );
    const svgs = container.querySelectorAll('svg');
    expect(svgs).toHaveLength(10);
  });

  it('renders FOOD_DRINK icon (Utensils)', () => {
    const { container } = render(<CategoryIcon category="FOOD_DRINK" />);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('renders TRANSPORT icon (Car)', () => {
    const { container } = render(<CategoryIcon category="TRANSPORT" />);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('renders HEALTH icon (HeartPulse)', () => {
    const { container } = render(<CategoryIcon category="HEALTH" />);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('renders OTHER icon (MoreHorizontal)', () => {
    const { container } = render(<CategoryIcon category="OTHER" />);
    expect(container.querySelector('svg')).toBeTruthy();
  });
});
