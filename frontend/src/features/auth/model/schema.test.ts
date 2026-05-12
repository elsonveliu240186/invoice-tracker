import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema, forgotPasswordSchema } from './schema';

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: 'secret' });
    expect(result.success).toBe(true);
  });

  it('rejects empty email', () => {
    const result = loginSchema.safeParse({ email: '', password: 'secret' });
    expect(result.success).toBe(false);
    const issues = result.error?.issues ?? [];
    expect(issues.some((i) => i.path[0] === 'email')).toBe(true);
  });

  it('rejects invalid email format', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'secret' });
    expect(result.success).toBe(false);
  });

  it('rejects email longer than 254 chars', () => {
    // 250 chars local part + '@b.com' = 256 chars total — exceeds the 254 limit
    const longEmail = 'a'.repeat(250) + '@b.com';
    const result = loginSchema.safeParse({ email: longEmail, password: 'secret' });
    expect(result.success).toBe(false);
  });

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: '' });
    expect(result.success).toBe(false);
    const issues = result.error?.issues ?? [];
    expect(issues.some((i) => i.path[0] === 'password')).toBe(true);
  });
});

describe('registerSchema', () => {
  const valid = {
    displayName: 'Alice',
    email: 'alice@example.com',
    password: 'Password1',
    confirmPassword: 'Password1',
  };

  it('accepts valid registration data', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects displayName > 120 chars', () => {
    const result = registerSchema.safeParse({ ...valid, displayName: 'a'.repeat(121) });
    expect(result.success).toBe(false);
  });

  it('rejects empty displayName', () => {
    const result = registerSchema.safeParse({ ...valid, displayName: '' });
    expect(result.success).toBe(false);
  });

  it('rejects password shorter than 8 chars', () => {
    const result = registerSchema.safeParse({
      ...valid,
      password: 'Pas1',
      confirmPassword: 'Pas1',
    });
    expect(result.success).toBe(false);
    const issues = result.error?.issues ?? [];
    expect(issues.some((i) => i.path[0] === 'password')).toBe(true);
  });

  it('rejects password without digit', () => {
    const result = registerSchema.safeParse({
      ...valid,
      password: 'Passwordonly',
      confirmPassword: 'Passwordonly',
    });
    expect(result.success).toBe(false);
  });

  it('rejects password without letter', () => {
    const result = registerSchema.safeParse({
      ...valid,
      password: '12345678',
      confirmPassword: '12345678',
    });
    expect(result.success).toBe(false);
  });

  it('rejects when confirmPassword does not match password', () => {
    const result = registerSchema.safeParse({ ...valid, confirmPassword: 'different1' });
    expect(result.success).toBe(false);
    const issues = result.error?.issues ?? [];
    expect(issues.some((i) => i.path[0] === 'confirmPassword')).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({ ...valid, email: 'bad' });
    expect(result.success).toBe(false);
  });
});

describe('forgotPasswordSchema', () => {
  it('accepts valid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'user@example.com' }).success).toBe(true);
  });

  it('rejects empty email', () => {
    expect(forgotPasswordSchema.safeParse({ email: '' }).success).toBe(false);
  });

  it('rejects invalid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'not-email' }).success).toBe(false);
  });
});
