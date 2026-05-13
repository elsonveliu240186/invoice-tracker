import { z } from 'zod';

export const createClientSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(120, 'Name must be at most 120 characters'),
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
});

export const updateClientSchema = createClientSchema;

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
