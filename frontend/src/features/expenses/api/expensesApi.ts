import { http } from '@/shared/lib/http';
import type {
  Expense,
  ExpensePage,
  ExpenseSummary,
  CreateExpensePayload,
  UpdateExpensePayload,
  ExpenseCategory,
} from '../model/types';

const BASE = '/api/v1/expenses';

export async function listExpenses(
  page = 0,
  size = 20,
  category?: ExpenseCategory,
  dateFrom?: string,
  dateTo?: string,
): Promise<ExpensePage> {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort: 'expenseDate,desc',
  });
  if (category) params.set('category', category);
  if (dateFrom) params.set('dateFrom', dateFrom);
  if (dateTo) params.set('dateTo', dateTo);
  return http<ExpensePage>(`${BASE}?${params.toString()}`);
}

export async function getExpense(id: string): Promise<Expense> {
  return http<Expense>(`${BASE}/${id}`);
}

export async function createExpense(payload: CreateExpensePayload): Promise<Expense> {
  return http<Expense>(BASE, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateExpense(id: string, payload: UpdateExpensePayload): Promise<Expense> {
  return http<Expense>(`${BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteExpense(id: string): Promise<void> {
  return http<void>(`${BASE}/${id}`, {
    method: 'DELETE',
  });
}

export async function getExpenseSummary(month?: string): Promise<ExpenseSummary> {
  const params = new URLSearchParams();
  if (month) params.set('month', month);
  const qs = params.toString();
  return http<ExpenseSummary>(`${BASE}/summary${qs ? `?${qs}` : ''}`);
}
