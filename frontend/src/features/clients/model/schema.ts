import { z } from 'zod';

export const createClientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(120, 'Name must be at most 120 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .max(254, 'Email must be at most 254 characters')
    .email('Must be a valid email address'),
  phone: z
    .string()
    .max(32, 'Phone must be at most 32 characters')
    .regex(/^[+\-() 0-9]+$/, 'Phone may only contain digits, +, -, spaces, ( and )')
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .max(500, 'Address must be at most 500 characters')
    .optional()
    .or(z.literal('')),
  companyName: z
    .string()
    .max(200, 'Company name must be at most 200 characters')
    .optional()
    .or(z.literal('')),
  companyAddress: z
    .string()
    .max(500, 'Company address must be at most 500 characters')
    .optional()
    .or(z.literal('')),
  companyVatNumber: z
    .string()
    .max(50, 'VAT number must be at most 50 characters')
    .optional()
    .or(z.literal('')),
  companyIban: z
    .string()
    .max(100, 'IBAN must be at most 100 characters')
    .optional()
    .or(z.literal('')),
  companySwiftBic: z
    .string()
    .max(20, 'Swift/BIC must be at most 20 characters')
    .optional()
    .or(z.literal('')),
  companyBankName: z
    .string()
    .max(200, 'Bank name must be at most 200 characters')
    .optional()
    .or(z.literal('')),
});

export const updateClientSchema = createClientSchema;

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
