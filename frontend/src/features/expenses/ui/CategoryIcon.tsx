import {
  Utensils,
  Car,
  Home,
  HeartPulse,
  Clapperboard,
  ShoppingBag,
  Plane,
  GraduationCap,
  Zap,
  MoreHorizontal,
  type LucideIcon,
} from 'lucide-react';
import type { ExpenseCategory } from '../model/types';

interface CategoryIconProps {
  category: ExpenseCategory;
  className?: string;
}

const ICON_MAP: Record<ExpenseCategory, LucideIcon> = {
  FOOD_DRINK: Utensils,
  TRANSPORT: Car,
  HOUSING: Home,
  HEALTH: HeartPulse,
  ENTERTAINMENT: Clapperboard,
  SHOPPING: ShoppingBag,
  TRAVEL: Plane,
  EDUCATION: GraduationCap,
  UTILITIES: Zap,
  OTHER: MoreHorizontal,
};

export function CategoryIcon({ category, className }: CategoryIconProps) {
  const Icon = ICON_MAP[category];
  return <Icon className={className ?? 'h-4 w-4'} aria-hidden="true" data-category={category} />;
}
