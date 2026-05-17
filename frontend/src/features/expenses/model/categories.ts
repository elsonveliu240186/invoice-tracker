import type { ExpenseCategory } from './types';

export const EXPENSE_CATEGORIES: readonly ExpenseCategory[] = [
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
] as const;

export function categoryLabel(category: ExpenseCategory): string {
  const labels: Record<ExpenseCategory, string> = {
    FOOD_DRINK: 'Food & Drink',
    TRANSPORT: 'Transport',
    HOUSING: 'Housing',
    HEALTH: 'Health',
    ENTERTAINMENT: 'Entertainment',
    SHOPPING: 'Shopping',
    TRAVEL: 'Travel',
    EDUCATION: 'Education',
    UTILITIES: 'Utilities',
    OTHER: 'Other',
  };
  return labels[category];
}
