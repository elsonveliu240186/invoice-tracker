import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CategoryBadge } from './CategoryBadge';
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

describe('CategoryBadge', () => {
  it('renders the category label for FOOD_DRINK', () => {
    render(<CategoryBadge category="FOOD_DRINK" />);
    expect(screen.getByText('Food & Drink')).toBeInTheDocument();
  });

  it('renders an icon (svg) alongside the label', () => {
    const { container } = render(<CategoryBadge category="TRANSPORT" />);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('sets data-category attribute on the badge', () => {
    render(<CategoryBadge category="HOUSING" />);
    const badge = screen.getByTestId('category-badge');
    expect(badge.getAttribute('data-category')).toBe('HOUSING');
  });

  it.each(CATEGORIES)('renders without error for %s', (category) => {
    const { container } = render(<CategoryBadge category={category} />);
    expect(container.querySelector('[data-testid="category-badge"]')).toBeTruthy();
  });

  it('applies category-specific colour class', () => {
    const { container } = render(<CategoryBadge category="HEALTH" />);
    const badge = container.querySelector('[data-testid="category-badge"]');
    // HEALTH uses red-100 / red-800
    expect(badge?.className).toContain('red');
  });

  it('renders OTHER label', () => {
    render(<CategoryBadge category="OTHER" />);
    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  it('renders EDUCATION label', () => {
    render(<CategoryBadge category="EDUCATION" />);
    expect(screen.getByText('Education')).toBeInTheDocument();
  });
});
