import { http } from '@/shared/lib/http';
import type { DashboardStats } from '../model/types';

export async function getDashboardStats(): Promise<DashboardStats> {
  return http<DashboardStats>('/api/v1/dashboard/stats');
}
