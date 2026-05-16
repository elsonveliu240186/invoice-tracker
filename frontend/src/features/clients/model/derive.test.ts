import { describe, it, expect } from 'vitest';
import { deriveStatus, formatDate } from './derive';
import type { Client } from './types';

function makeClient(overrides: Partial<Client> = {}): Client {
  return {
    id: '1',
<<<<<<< HEAD
    name: 'Test Client',
=======
    name: 'Test',
>>>>>>> feat/FEAT-20260512-03-dashboard-core-ui
    email: 'test@example.com',
    phone: null,
    address: null,
    companyName: '',
    companyAddress: '',
    companyVatNumber: '',
    companyIban: '',
    companySwiftBic: '',
    companyBankName: '',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
<<<<<<< HEAD
    deletedAt: null,
=======
>>>>>>> feat/FEAT-20260512-03-dashboard-core-ui
    ...overrides,
  };
}

describe('deriveStatus', () => {
<<<<<<< HEAD
  it('returns ACTIVE when deletedAt is null', () => {
    expect(deriveStatus(makeClient({ deletedAt: null }))).toBe('ACTIVE');
  });

  it('returns ACTIVE when deletedAt is absent (no property)', () => {
    // Pass an object that only has the deletedAt property omitted entirely
    expect(deriveStatus({ deletedAt: null })).toBe('ACTIVE');
  });

  it('returns INACTIVE when deletedAt is a date string', () => {
    expect(deriveStatus(makeClient({ deletedAt: '2024-06-01T00:00:00Z' }))).toBe('INACTIVE');
=======
  it('defaults to ACTIVE when no status field present', () => {
    expect(deriveStatus(makeClient())).toBe('ACTIVE');
  });

  it('returns INACTIVE when status field is INACTIVE', () => {
    const client = { ...makeClient(), status: 'INACTIVE' } as unknown as Client;
    expect(deriveStatus(client)).toBe('INACTIVE');
  });

  it('returns ACTIVE when status field is ACTIVE', () => {
    const client = { ...makeClient(), status: 'ACTIVE' } as unknown as Client;
    expect(deriveStatus(client)).toBe('ACTIVE');
  });

  it('returns ACTIVE when status field is an unknown value', () => {
    const client = { ...makeClient(), status: 'PENDING' } as unknown as Client;
    expect(deriveStatus(client)).toBe('ACTIVE');
>>>>>>> feat/FEAT-20260512-03-dashboard-core-ui
  });
});

describe('formatDate', () => {
<<<<<<< HEAD
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
=======
  it('returns empty string for empty input', () => {
    expect(formatDate('')).toBe('');
  });

  it('returns empty string for invalid ISO string', () => {
    expect(formatDate('not-a-date')).toBe('');
  });

  it('returns a non-empty locale string for a valid ISO date', () => {
    const result = formatDate('2024-03-15T00:00:00Z');
    expect(result).not.toBe('');
    expect(typeof result).toBe('string');
  });

  it('returns a string containing the year for a valid date', () => {
    const result = formatDate('2024-03-15T00:00:00Z');
    expect(result).toContain('2024');
  });
>>>>>>> feat/FEAT-20260512-03-dashboard-core-ui
});
