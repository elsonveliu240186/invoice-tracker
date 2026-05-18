import { z } from 'zod';

export const companyProfileSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Name is required' })
    .max(200, { message: 'Name must be at most 200 characters' }),
  email: z
    .string()
    .max(254, { message: 'Email must be at most 254 characters' })
    .refine((val) => val === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: 'Must be a valid email address',
    })
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .max(32, { message: 'Phone must be at most 32 characters' })
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .max(500, { message: 'Address must be at most 500 characters' })
    .optional()
    .or(z.literal('')),
  vatNumber: z
    .string()
    .max(50, { message: 'VAT number must be at most 50 characters' })
    .optional()
    .or(z.literal('')),
  iban: z
    .string()
    .max(100, { message: 'IBAN must be at most 100 characters' })
    .optional()
    .or(z.literal('')),
  swiftBic: z
    .string()
    .max(20, { message: 'SWIFT/BIC must be at most 20 characters' })
    .optional()
    .or(z.literal('')),
  bankName: z
    .string()
    .max(200, { message: 'Bank name must be at most 200 characters' })
    .optional()
    .or(z.literal('')),
});

export type CompanyProfileFormValues = z.infer<typeof companyProfileSchema>;
