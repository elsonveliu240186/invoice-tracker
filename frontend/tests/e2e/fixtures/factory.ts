/**
 * TestDataFactory — typed API-level builders for seeding E2E test data.
 */
import type { APIRequestContext } from '@playwright/test';
import {
  registerUser,
  createClient,
  createInvoice,
  createExpense,
  saveCompanyProfile,
  getBasicAuthHeader,
  type ClientResponse,
  type InvoiceResponse,
  type ExpenseResponse,
  type CompanyProfileResponse,
} from './api';

export class TestDataFactory {
  constructor(
    private readonly request: APIRequestContext,
    private readonly authHeader: string,
  ) {}

  async createUser(overrides?: {
    email?: string;
    password?: string;
    name?: string;
  }): Promise<{ email: string; password: string }> {
    const ts = Date.now();
    const email = overrides?.email ?? `user-${ts}@e2e.test`;
    const password = overrides?.password ?? 'Secret1!';
    const name = overrides?.name ?? `E2E User ${ts}`;
    await registerUser(this.request, email, password, name);
    return { email, password };
  }

  async createClient(
    overrides?: Partial<{ name: string; email: string; phone: string; address: string }>,
  ): Promise<ClientResponse> {
    const ts = Date.now();
    return createClient(this.request, this.authHeader, {
      name: `Test Client ${ts}`,
      email: `client-${ts}@e2e.test`,
      ...overrides,
    });
  }

  async createInvoice(
    clientId: string,
    overrides?: Partial<{
      number: string;
      issueDate: string;
      dueDate: string;
      taxRate: number;
      lines: Array<{ description: string; quantity: number; unitPrice: number }>;
    }>,
  ): Promise<InvoiceResponse> {
    return createInvoice(this.request, this.authHeader, { clientId, ...overrides });
  }

  async createExpense(
    overrides?: Partial<{
      amount: number;
      category: string;
      expenseDate: string;
      description: string;
    }>,
  ): Promise<ExpenseResponse> {
    return createExpense(this.request, this.authHeader, overrides ?? {});
  }

  async saveCompanyProfile(
    overrides?: Partial<CompanyProfileResponse>,
  ): Promise<CompanyProfileResponse> {
    return saveCompanyProfile(this.request, this.authHeader, overrides ?? {});
  }
}

export { getBasicAuthHeader };
