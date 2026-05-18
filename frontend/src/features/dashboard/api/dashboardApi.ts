import { http } from '@/shared/lib/http';
import type { DashboardStats } from '../model/types';

export async function getDashboardStats(
  from?: string | null,
  to?: string | null,
): Promise<DashboardStats> {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const query = params.toString();
  const url = `/api/v1/dashboard/stats${query ? `?${query}` : ''}`;
  return http<DashboardStats>(url);
}
