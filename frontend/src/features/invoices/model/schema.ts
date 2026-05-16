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

// ── Invoice form schemas ──────────────────────────────────────────────────────

export const invoiceLineFormSchema = z.object({
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
  quantity: z
    .number({ invalid_type_error: 'Quantity must be a number' })
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1'),
  unitPrice: z
    .number({ invalid_type_error: 'Unit price must be a number' })
    .min(0, 'Unit price must be 0 or more')
    .refine(
      (val) => /^\d+(\.\d{1,2})?$/.test(val.toFixed(2)),
      'Unit price can have at most 2 decimal places',
    ),
});

export const invoiceFormSchema = z
  .object({
    clientId: z.string().uuid('Please select a client'),
    number: z.string().max(64, 'Number too long').optional(),
    issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Issue date must be YYYY-MM-DD'),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be YYYY-MM-DD'),
    taxRate: z
      .number({ invalid_type_error: 'Tax rate must be a number' })
      .min(0, 'Tax rate must be 0 or more')
      .max(1, 'Tax rate must be 1 or less'),
    lines: z.array(invoiceLineFormSchema).min(1, 'At least one line item is required'),
  })
  .refine((data) => data.dueDate >= data.issueDate, {
    message: 'Due date must be on or after issue date',
    path: ['dueDate'],
  });

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;
export type InvoiceLineFormValues = z.infer<typeof invoiceLineFormSchema>;
