import { useTranslation } from 'react-i18next';
import { CategoryIcon } from './CategoryIcon';
import { categoryLabel } from '../model/categories';
import type { ExpenseCategory } from '../model/types';

interface CategoryBadgeProps {
  category: ExpenseCategory;
}

const CATEGORY_CLASSES: Record<ExpenseCategory, string> = {
  FOOD_DRINK: 'bg-orange-100 text-orange-800',
  TRANSPORT: 'bg-blue-100 text-blue-800',
  HOUSING: 'bg-yellow-100 text-yellow-800',
  HEALTH: 'bg-red-100 text-red-800',
  ENTERTAINMENT: 'bg-purple-100 text-purple-800',
  SHOPPING: 'bg-pink-100 text-pink-800',
  TRAVEL: 'bg-sky-100 text-sky-800',
  EDUCATION: 'bg-indigo-100 text-indigo-800',
  UTILITIES: 'bg-amber-100 text-amber-800',
  OTHER: 'bg-gray-100 text-gray-700',
};

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const { t } = useTranslation();
  const cls = CATEGORY_CLASSES[category];
  const label = t(`expenses.categories.${category}`, categoryLabel(category));

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}
      data-testid="category-badge"
      data-category={category}
    >
      <CategoryIcon category={category} className="h-3 w-3" />
      {label}
    </span>
  );
}
