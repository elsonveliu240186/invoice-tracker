import { z } from 'zod';
import type { ExpenseCategory } from './types';

const EXPENSE_CATEGORIES: [ExpenseCategory, ...ExpenseCategory[]] = [
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

const today = () => {
  const d = new Date();
  return `${String(d.getFullYear())}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const expenseFormSchema = z.object({
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be greater than 0')
    .max(9_999_999.99, 'Amount must not exceed 9,999,999.99'),
  category: z.enum(EXPENSE_CATEGORIES, {
    errorMap: () => ({ message: 'Please select a valid category' }),
  }),
  expenseDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine((val) => val <= today(), { message: 'Expense date cannot be in the future' }),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .nullable()
    .optional(),
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;
