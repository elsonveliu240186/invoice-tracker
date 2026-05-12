import { z } from 'zod';

const emailField = z
  .string()
  .min(1, 'auth.errors.emailRequired')
  .max(254, 'auth.errors.emailTooLong')
  .email('auth.errors.emailInvalid');

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'auth.errors.passwordRequired'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    displayName: z
      .string()
      .min(1, 'auth.errors.displayNameRequired')
      .max(120, 'auth.errors.displayNameTooLong'),
    email: emailField,
    password: z
      .string()
      .min(8, 'auth.errors.passwordTooShort')
      .regex(/(?=.*[a-zA-Z])(?=.*\d)/, 'auth.errors.passwordTooWeak'),
    confirmPassword: z.string().min(1, 'auth.errors.confirmPasswordRequired'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'auth.errors.passwordsMustMatch',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
