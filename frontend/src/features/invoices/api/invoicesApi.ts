import { http } from '@/shared/lib/http';
import type { Invoice, InvoicePage, SendEmailResponse } from '../model/types';

const BASE = '/api/v1/invoices';

export async function listInvoices(page = 0, size = 20): Promise<InvoicePage> {
  return http<InvoicePage>(`${BASE}?page=${page}&size=${size}&sort=createdAt,desc`);
}

export async function getInvoice(id: string): Promise<Invoice> {
  return http<Invoice>(`${BASE}/${id}`);
}

/**
 * Returns a URL string (not a blob) suitable for use as an <iframe src> or anchor href.
 * The browser will request the PDF with the auth credentials attached via the Basic auth
 * header added by the http utility only when used in fetch calls.
 * For direct iframe usage, the browser sends cookies (credentials: 'include' is handled
 * at fetch level), so we return the path directly.
 */
export function getInvoicePdfUrl(id: string): string {
  return `${BASE}/${id}/pdf`;
}

export async function sendInvoiceEmail(id: string): Promise<SendEmailResponse> {
  return http<SendEmailResponse>(`${BASE}/${id}/send-email`, {
    method: 'POST',
  });
}
