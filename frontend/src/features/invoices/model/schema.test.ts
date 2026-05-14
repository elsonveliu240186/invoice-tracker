import { describe, it, expect } from 'vitest';
import { invoiceSchema, invoiceLineSchema, sendEmailResponseSchema } from './schema';

const validLine = {
  id: '00000000-0000-0000-0000-000000000001',
  description: 'Consulting services',
  quantity: 2,
  unitPrice: '50.00',
  lineTotal: '100.00',
};

const validInvoice = {
  id: '00000000-0000-0000-0000-000000000002',
  number: 'INV-2026-0001',
  clientId: '00000000-0000-0000-0000-000000000003',
  clientEmail: 'client@example.com',
  issueDate: '2026-05-13',
  dueDate: '2026-06-12',
  taxRate: '0.21',
  lines: [validLine],
  subtotal: '100.00',
  total: '121.00',
  lastSentAt: null,
  createdAt: '2026-05-13T20:00:00Z',
  updatedAt: '2026-05-13T20:00:00Z',
};

describe('invoiceLineSchema', () => {
  it('accepts a valid line', () => {
    const result = invoiceLineSchema.safeParse(validLine);
    expect(result.success).toBe(true);
  });

  it('rejects quantity of zero', () => {
    const result = invoiceLineSchema.safeParse({ ...validLine, quantity: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects negative quantity', () => {
    const result = invoiceLineSchema.safeParse({ ...validLine, quantity: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects empty description', () => {
    const result = invoiceLineSchema.safeParse({ ...validLine, description: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid unitPrice format', () => {
    const result = invoiceLineSchema.safeParse({ ...validLine, unitPrice: 'abc' });
    expect(result.success).toBe(false);
  });

  it('rejects non-uuid id', () => {
    const result = invoiceLineSchema.safeParse({ ...validLine, id: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });
});

describe('invoiceSchema', () => {
  it('accepts a valid invoice with null lastSentAt', () => {
    const result = invoiceSchema.safeParse(validInvoice);
    expect(result.success).toBe(true);
  });

  it('accepts a valid invoice with non-null lastSentAt', () => {
    const result = invoiceSchema.safeParse({
      ...validInvoice,
      lastSentAt: '2026-05-13T20:55:00Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid issueDate format', () => {
    const result = invoiceSchema.safeParse({ ...validInvoice, issueDate: '13-05-2026' });
    expect(result.success).toBe(false);
  });

  it('rejects empty number', () => {
    const result = invoiceSchema.safeParse({ ...validInvoice, number: '' });
    expect(result.success).toBe(false);
  });

  it('rejects non-uuid id', () => {
    const result = invoiceSchema.safeParse({ ...validInvoice, id: 'bad-id' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid lastSentAt format', () => {
    const result = invoiceSchema.safeParse({ ...validInvoice, lastSentAt: 'not-a-date' });
    expect(result.success).toBe(false);
  });

  it('rejects missing lines', () => {
    const withoutLines = Object.fromEntries(
      Object.entries(validInvoice).filter(([k]) => k !== 'lines'),
    );
    const result = invoiceSchema.safeParse(withoutLines);
    expect(result.success).toBe(false);
  });
});

describe('sendEmailResponseSchema', () => {
  it('accepts a valid response', () => {
    const result = sendEmailResponseSchema.safeParse({ lastSentAt: '2026-05-13T20:55:00Z' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid datetime', () => {
    const result = sendEmailResponseSchema.safeParse({ lastSentAt: 'not-a-date' });
    expect(result.success).toBe(false);
  });

  it('rejects missing lastSentAt', () => {
    const result = sendEmailResponseSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
