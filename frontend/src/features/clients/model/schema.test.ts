import { describe, it, expect } from 'vitest';
import { createClientSchema } from './schema';

describe('createClientSchema', () => {
  it('accepts a minimal valid payload with name and email only', () => {
    const result = createClientSchema.safeParse({ name: 'Acme', email: 'acme@example.com' });
    expect(result.success).toBe(true);
  });

  it('accepts a fully populated payload', () => {
    const result = createClientSchema.safeParse({
      name: 'Acme Corp',
      email: 'acme@example.com',
      phone: '+1 (800) 555-0100',
      address: '123 Main St, Springfield, IL 62701',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty name', () => {
    const result = createClientSchema.safeParse({ name: '', email: 'a@b.com' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const nameIssue = result.error.issues.find((i) => i.path[0] === 'name');
      expect(nameIssue).toBeDefined();
    }
  });

  it('rejects a name longer than 120 characters', () => {
    const result = createClientSchema.safeParse({
      name: 'A'.repeat(121),
      email: 'a@b.com',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const nameIssue = result.error.issues.find((i) => i.path[0] === 'name');
      expect(nameIssue).toBeDefined();
    }
  });

  it('rejects an invalid email', () => {
    const result = createClientSchema.safeParse({ name: 'Test', email: 'not-an-email' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailIssue = result.error.issues.find((i) => i.path[0] === 'email');
      expect(emailIssue).toBeDefined();
    }
  });

  it('rejects an email longer than 254 characters', () => {
    // local part (64) + '@' + domain (191) = 256 chars total, which exceeds 254
    const longEmail = 'a'.repeat(64) + '@' + 'b'.repeat(186) + '.com';
    expect(longEmail.length).toBeGreaterThan(254);
    const result = createClientSchema.safeParse({
      name: 'Test',
      email: longEmail,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a phone with invalid characters', () => {
    const result = createClientSchema.safeParse({
      name: 'Test',
      email: 'test@example.com',
      phone: 'abc123',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const phoneIssue = result.error.issues.find((i) => i.path[0] === 'phone');
      expect(phoneIssue).toBeDefined();
    }
  });

  it('rejects a phone longer than 32 characters', () => {
    const result = createClientSchema.safeParse({
      name: 'Test',
      email: 'test@example.com',
      phone: '1'.repeat(33),
    });
    expect(result.success).toBe(false);
  });

  it('accepts a phone with valid characters', () => {
    const result = createClientSchema.safeParse({
      name: 'Test',
      email: 'test@example.com',
      phone: '+1 (555) 123-4567',
    });
    expect(result.success).toBe(true);
  });

  it('accepts an empty phone string', () => {
    const result = createClientSchema.safeParse({
      name: 'Test',
      email: 'test@example.com',
      phone: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an address longer than 500 characters', () => {
    const result = createClientSchema.safeParse({
      name: 'Test',
      email: 'test@example.com',
      address: 'A'.repeat(501),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const addrIssue = result.error.issues.find((i) => i.path[0] === 'address');
      expect(addrIssue).toBeDefined();
    }
  });
});
