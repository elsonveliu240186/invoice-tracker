import { z } from 'zod';

export const templateMetadataSchema = z.object({
  filename: z.string().min(1),
  size: z.number().int().nonnegative(),
  uploadedAt: z.string().datetime({ offset: true }),
  isDefault: z.boolean(),
});

export const uploadTemplateResponseSchema = z.object({
  filename: z.string().min(1),
  size: z.number().int().nonnegative(),
  uploadedAt: z.string().datetime({ offset: true }),
});

export type TemplateMetadataSchema = z.infer<typeof templateMetadataSchema>;
export type UploadTemplateResponseSchema = z.infer<typeof uploadTemplateResponseSchema>;
