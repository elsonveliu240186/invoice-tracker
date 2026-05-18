import { http } from '@/shared/lib/http';
import type { DashboardExpenseStats } from '../model/types';

export async function getDashboardExpenseStats(
  from?: string | null,
  to?: string | null,
): Promise<DashboardExpenseStats> {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const query = params.toString();
  const url = `/api/v1/dashboard/expense-stats${query ? `?${query}` : ''}`;
  return http<DashboardExpenseStats>(url);
}
