/**
 * Raw HTTP helpers for E2E test seeding and teardown.
 * All functions use the real backend API — no mocking.
 */
import type { APIRequestContext } from '@playwright/test';

const API_URL = process.env['E2E_API_URL'] ?? 'http://localhost:8082';
const MAILHOG_URL = process.env['E2E_MAILHOG_URL'] ?? 'http://localhost:8026';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ClientResponse {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

export interface InvoiceLine {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: string;
  lineTotal?: string;
}

export interface InvoiceResponse {
  id: string;
  number: string;
  status: string;
  clientId: string;
  clientNameSnapshot?: string;
  clientEmail?: string;
  issueDate: string;
  dueDate: string;
  taxRate: string;
  subtotal: string;
  total: string;
  lines: InvoiceLine[];
  lastSentAt?: string;
}

export interface ExpenseResponse {
  id: string;
  amount: number;
  category: string;
  expenseDate: string;
  description?: string;
}

export interface CompanyProfileResponse {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  vatNumber?: string;
  iban?: string;
  swiftBic?: string;
  bankName?: string;
}

export interface MailhogMessage {
  ID: string;
  From: { Relpath: string; Mailbox: string; Domain: string };
  To: Array<{ Relpath: string; Mailbox: string; Domain: string }>;
  Content: {
    Headers: Record<string, string[]>;
    Body: string;
  };
  Created: string;
  Raw: { From: string; To: string[]; Data: string };
}

// ── Auth helpers ──────────────────────────────────────────────────────────────

export function getBasicAuthHeader(email: string, password: string): string {
  // btoa is available in both browsers and Node.js 16+
  return 'Basic ' + btoa(`${email}:${password}`);
}

export async function registerUser(
  request: APIRequestContext,
  email: string,
  password: string,
  name: string,
): Promise<void> {
  const response = await request.post(`${API_URL}/api/v1/auth/register`, {
    data: { email, password, displayName: name },
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok() && response.status() !== 409) {
    throw new Error(
      `registerUser failed: ${response.status()} ${await response.text()}`,
    );
  }
}

// ── Client helpers ────────────────────────────────────────────────────────────

export async function createClient(
  request: APIRequestContext,
  authHeader: string,
  data: Partial<{ name: string; email: string; phone: string; address: string }>,
): Promise<ClientResponse> {
  const response = await request.post(`${API_URL}/api/v1/clients`, {
    data,
    headers: { 'Content-Type': 'application/json', Authorization: authHeader },
  });
  if (!response.ok()) {
    throw new Error(`createClient failed: ${response.status()} ${await response.text()}`);
  }
  return (await response.json()) as ClientResponse;
}

// ── Invoice helpers ───────────────────────────────────────────────────────────

export async function createInvoice(
  request: APIRequestContext,
  authHeader: string,
  data: {
    clientId: string;
    number?: string;
    issueDate?: string;
    dueDate?: string;
    taxRate?: number;
    lines?: Array<{ description: string; quantity: number; unitPrice: number }>;
  },
): Promise<InvoiceResponse> {
  const today = new Date().toISOString().slice(0, 10);
  const due = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const payload = {
    number: data.number ?? `INV-${Date.now()}`,
    clientId: data.clientId,
    issueDate: data.issueDate ?? today,
    dueDate: data.dueDate ?? due,
    taxRate: data.taxRate ?? 0,
    lines: data.lines ?? [{ description: 'Services', quantity: 1, unitPrice: 100 }],
  };
  const response = await request.post(`${API_URL}/api/v1/invoices`, {
    data: payload,
    headers: { 'Content-Type': 'application/json', Authorization: authHeader },
  });
  if (!response.ok()) {
    throw new Error(`createInvoice failed: ${response.status()} ${await response.text()}`);
  }
  return (await response.json()) as InvoiceResponse;
}

// ── Expense helpers ───────────────────────────────────────────────────────────

export async function createExpense(
  request: APIRequestContext,
  authHeader: string,
  data: Partial<{
    amount: number;
    category: string;
    expenseDate: string;
    description: string;
  }>,
): Promise<ExpenseResponse> {
  const today = new Date().toISOString().slice(0, 10);
  const payload = {
    amount: data.amount ?? 50,
    category: data.category ?? 'OFFICE',
    expenseDate: data.expenseDate ?? today,
    description: data.description ?? 'Test expense',
  };
  const response = await request.post(`${API_URL}/api/v1/expenses`, {
    data: payload,
    headers: { 'Content-Type': 'application/json', Authorization: authHeader },
  });
  if (!response.ok()) {
    throw new Error(`createExpense failed: ${response.status()} ${await response.text()}`);
  }
  return (await response.json()) as ExpenseResponse;
}

// ── Company profile helpers ───────────────────────────────────────────────────

export async function saveCompanyProfile(
  request: APIRequestContext,
  authHeader: string,
  data: Partial<CompanyProfileResponse>,
): Promise<CompanyProfileResponse> {
  const response = await request.put(`${API_URL}/api/v1/settings/company`, {
    data: { name: 'Test Company', ...data },
    headers: { 'Content-Type': 'application/json', Authorization: authHeader },
  });
  if (!response.ok()) {
    throw new Error(`saveCompanyProfile failed: ${response.status()} ${await response.text()}`);
  }
  return (await response.json()) as CompanyProfileResponse;
}

// ── MailHog helpers ───────────────────────────────────────────────────────────

export async function purgeMailhog(): Promise<void> {
  const response = await fetch(`${MAILHOG_URL}/api/v1/messages`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    // non-fatal — MailHog may not have a DELETE endpoint in all versions
    console.warn(`purgeMailhog: ${response.status}`);
  }
}

export async function getMailhogMessages(): Promise<MailhogMessage[]> {
  const response = await fetch(`${MAILHOG_URL}/api/v2/messages`);
  if (!response.ok) {
    throw new Error(`getMailhogMessages failed: ${response.status}`);
  }
  const body = (await response.json()) as { items: MailhogMessage[]; count: number; total: number };
  return body.items ?? [];
}

// ── Backend reset ─────────────────────────────────────────────────────────────

export async function resetBackend(
  request: APIRequestContext,
  authHeader: string,
): Promise<void> {
  const response = await request.post(`${API_URL}/api/v1/test-support/reset`, {
    headers: { Authorization: authHeader },
  });
  if (!response.ok()) {
    throw new Error(`resetBackend failed: ${response.status()} ${await response.text()}`);
  }
}
