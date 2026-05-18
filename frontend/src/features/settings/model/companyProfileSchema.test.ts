import { describe, it, expect } from 'vitest';
import { companyProfileSchema } from './companyProfileSchema';

const VALID_PAYLOAD = {
  name: 'Invoice Tracker Co',
  email: 'billing@example.com',
  phone: '+1 555 000 0000',
  address: '123 Business Ave, New York',
  vatNumber: 'US123456789',
  iban: 'US12 3456 7890 1234 5678 90',
  swiftBic: 'BOFAUS3N',
  bankName: 'Bank of Example',
};

describe('companyProfileSchema', () => {
  it('accepts a valid full payload', () => {
    const result = companyProfileSchema.safeParse(VALID_PAYLOAD);
    expect(result.success).toBe(true);
  });

  it('accepts empty optional fields', () => {
    const result = companyProfileSchema.safeParse({
      name: 'My Company',
      email: '',
      phone: '',
      address: '',
      vatNumber: '',
      iban: '',
      swiftBic: '',
      bankName: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects blank name', () => {
    const result = companyProfileSchema.safeParse({ ...VALID_PAYLOAD, name: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const nameError = result.error.issues.find((i) => i.path[0] === 'name');
      expect(nameError).toBeDefined();
    }
  });

  it('rejects name longer than 200 characters', () => {
    const result = companyProfileSchema.safeParse({ ...VALID_PAYLOAD, name: 'A'.repeat(201) });
    expect(result.success).toBe(false);
    if (!result.success) {
      const nameError = result.error.issues.find((i) => i.path[0] === 'name');
      expect(nameError).toBeDefined();
    }
  });

  it('rejects invalid email address', () => {
    const result = companyProfileSchema.safeParse({ ...VALID_PAYLOAD, email: 'not-an-email' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailError = result.error.issues.find((i) => i.path[0] === 'email');
      expect(emailError).toBeDefined();
    }
  });

  it('accepts empty string for email (optional)', () => {
    const result = companyProfileSchema.safeParse({ ...VALID_PAYLOAD, email: '' });
    expect(result.success).toBe(true);
  });

  it('rejects iban longer than 100 characters', () => {
    const result = companyProfileSchema.safeParse({ ...VALID_PAYLOAD, iban: 'I'.repeat(101) });
    expect(result.success).toBe(false);
    if (!result.success) {
      const ibanError = result.error.issues.find((i) => i.path[0] === 'iban');
      expect(ibanError).toBeDefined();
    }
  });

  it('rejects swiftBic longer than 20 characters', () => {
    const result = companyProfileSchema.safeParse({ ...VALID_PAYLOAD, swiftBic: 'B'.repeat(21) });
    expect(result.success).toBe(false);
    if (!result.success) {
      const swiftError = result.error.issues.find((i) => i.path[0] === 'swiftBic');
      expect(swiftError).toBeDefined();
    }
  });

  it('accepts name exactly 200 characters', () => {
    const result = companyProfileSchema.safeParse({ ...VALID_PAYLOAD, name: 'A'.repeat(200) });
    expect(result.success).toBe(true);
  });

  it('rejects email longer than 254 characters', () => {
    const localPart = 'a'.repeat(244);
    const result = companyProfileSchema.safeParse({
      ...VALID_PAYLOAD,
      email: `${localPart}@example.com`,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailError = result.error.issues.find((i) => i.path[0] === 'email');
      expect(emailError).toBeDefined();
    }
  });
});
