import { describe, it, expect } from 'vitest';
import { expenseFormSchema } from './schema';

const today = () => {
  const d = new Date();
  return `${String(d.getFullYear())}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const yesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${String(d.getFullYear())}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${String(d.getFullYear())}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

describe('expenseFormSchema', () => {
  it('accepts a valid expense', () => {
    const result = expenseFormSchema.safeParse({
      amount: 50.0,
      category: 'FOOD_DRINK',
      expenseDate: today(),
      description: 'Lunch',
    });
    expect(result.success).toBe(true);
  });

  it('accepts yesterday as a valid date', () => {
    const result = expenseFormSchema.safeParse({
      amount: 10,
      category: 'TRANSPORT',
      expenseDate: yesterday(),
    });
    expect(result.success).toBe(true);
  });

  it('accepts null description', () => {
    const result = expenseFormSchema.safeParse({
      amount: 10,
      category: 'OTHER',
      expenseDate: today(),
      description: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts missing description', () => {
    const result = expenseFormSchema.safeParse({
      amount: 10,
      category: 'OTHER',
      expenseDate: today(),
    });
    expect(result.success).toBe(true);
  });

  it('rejects amount = 0', () => {
    const result = expenseFormSchema.safeParse({
      amount: 0,
      category: 'FOOD_DRINK',
      expenseDate: today(),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('amount'))).toBe(true);
    }
  });

  it('rejects negative amount', () => {
    const result = expenseFormSchema.safeParse({
      amount: -5,
      category: 'FOOD_DRINK',
      expenseDate: today(),
    });
    expect(result.success).toBe(false);
  });

  it('rejects amount > 9999999.99', () => {
    const result = expenseFormSchema.safeParse({
      amount: 10_000_000,
      category: 'FOOD_DRINK',
      expenseDate: today(),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('amount'))).toBe(true);
    }
  });

  it('rejects unknown category', () => {
    const result = expenseFormSchema.safeParse({
      amount: 10,
      category: 'INVALID_CAT',
      expenseDate: today(),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('category'))).toBe(true);
    }
  });

  it('rejects future date', () => {
    const result = expenseFormSchema.safeParse({
      amount: 10,
      category: 'OTHER',
      expenseDate: tomorrow(),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('expenseDate'))).toBe(true);
    }
  });

  it('rejects description longer than 500 characters', () => {
    const result = expenseFormSchema.safeParse({
      amount: 10,
      category: 'OTHER',
      expenseDate: today(),
      description: 'a'.repeat(501),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('description'))).toBe(true);
    }
  });

  it('accepts description exactly 500 characters', () => {
    const result = expenseFormSchema.safeParse({
      amount: 10,
      category: 'OTHER',
      expenseDate: today(),
      description: 'a'.repeat(500),
    });
    expect(result.success).toBe(true);
  });
});
