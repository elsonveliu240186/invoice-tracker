import { http } from '@/shared/lib/http';
import type { Invoice } from '../model/types';

export async function markInvoicePaid(id: string): Promise<Invoice> {
  return http<Invoice>(`/api/v1/invoices/${id}/mark-paid`, { method: 'PATCH' });
}
