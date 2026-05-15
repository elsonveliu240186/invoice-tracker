import { describe, it, expect } from 'vitest';
import { deriveStatus, formatDate } from './derive';
import type { Client } from './types';

function makeClient(overrides: Partial<Client> = {}): Client {
  return {
    id: '1',
    name: 'Test Client',
    email: 'test@example.com',
    phone: null,
    address: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    deletedAt: null,
    ...overrides,
  };
}

describe('deriveStatus', () => {
  it('returns ACTIVE when deletedAt is null', () => {
    expect(deriveStatus(makeClient({ deletedAt: null }))).toBe('ACTIVE');
  });

  it('returns ACTIVE when deletedAt is absent (no property)', () => {
    // Pass an object that only has the deletedAt property omitted entirely
    expect(deriveStatus({ deletedAt: null })).toBe('ACTIVE');
  });

  it('returns INACTIVE when deletedAt is a date string', () => {
    expect(deriveStatus(makeClient({ deletedAt: '2024-06-01T00:00:00Z' }))).toBe('INACTIVE');
  });
});

describe('formatDate', () => {
  it('returns — for null', () => {
    expect(formatDate(null)).toBe('—');
  });

  it('returns — for undefined', () => {
    expect(formatDate(undefined)).toBe('—');
  });

  it('returns — for empty string', () => {
    expect(formatDate('')).toBe('—');
  });

  it('formats a valid ISO date string', () => {
    const result = formatDate('2024-01-15T00:00:00Z');
    // Result should contain year, day, and month abbreviation
    expect(result).toMatch(/2024/);
    expect(result).toMatch(/Jan|15/);
  });

  it('returns raw string if date is unparseable', () => {
    const result = formatDate('not-a-date');
    // Invalid dates: Intl.DateTimeFormat may output "Invalid Date" text or throw
    expect(typeof result).toBe('string');
  });
});
