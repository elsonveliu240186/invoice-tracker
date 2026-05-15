import { z } from 'zod';

export const invoiceLineSchema = z.object({
  id: z.string().uuid(),
  description: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/),
  lineTotal: z.string().regex(/^\d+(\.\d{1,2})?$/),
});

export const invoiceSchema = z.object({
  id: z.string().uuid(),
  number: z.string().min(1),
  clientId: z.string().uuid(),
  clientEmail: z.string().email().nullable(),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  taxRate: z.string().regex(/^\d+(\.\d+)?$/),
  lines: z.array(invoiceLineSchema),
  subtotal: z.string().regex(/^\d+(\.\d{1,2})?$/),
  total: z.string().regex(/^\d+(\.\d{1,2})?$/),
  lastSentAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const sendEmailResponseSchema = z.object({
  lastSentAt: z.string().datetime(),
});

export type InvoiceInput = z.infer<typeof invoiceSchema>;
export type InvoiceLineInput = z.infer<typeof invoiceLineSchema>;
export type SendEmailResponseInput = z.infer<typeof sendEmailResponseSchema>;
