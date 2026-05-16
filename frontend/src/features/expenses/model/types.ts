export type ExpenseCategory =
  | 'FOOD_DRINK'
  | 'TRANSPORT'
  | 'HOUSING'
  | 'HEALTH'
  | 'ENTERTAINMENT'
  | 'SHOPPING'
  | 'TRAVEL'
  | 'EDUCATION'
  | 'UTILITIES'
  | 'OTHER';

export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  description: string | null;
  expenseDate: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}

export interface ExpensePage {
  content: Expense[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ExpenseSummaryItem {
  category: ExpenseCategory;
  total: number;
  count: number;
}

export interface ExpenseSummary {
  month: string;
  grandTotal: number;
  totalCount: number;
  byCategory: ExpenseSummaryItem[];
}

export interface CreateExpensePayload {
  amount: number;
  category: ExpenseCategory;
  expenseDate: string;
  description?: string | null;
}

export interface UpdateExpensePayload {
  amount: number;
  category: ExpenseCategory;
  expenseDate: string;
  description?: string | null;
}
