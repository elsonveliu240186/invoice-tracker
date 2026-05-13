import { describe, it, expect } from 'vitest';
import { deriveStatus, formatDate } from './derive';
import type { Client } from './types';

function makeClient(overrides: Partial<Client> = {}): Client {
  return {
    id: '1',
    name: 'Test',
    email: 'test@example.com',
    phone: null,
    address: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('deriveStatus', () => {
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
  });
});

describe('formatDate', () => {
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
});
