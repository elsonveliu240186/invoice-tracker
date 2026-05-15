import type { Client } from './types';

export type ClientStatus = 'ACTIVE' | 'INACTIVE';

/**
 * Derives the display status of a client from its deletedAt field.
 * A client with a non-null deletedAt is considered INACTIVE (soft-deleted).
 */
export function deriveStatus(client: Pick<Client, 'deletedAt'>): ClientStatus {
  return client.deletedAt != null ? 'INACTIVE' : 'ACTIVE';
}

/**
 * Formats an ISO date string for display. Returns '—' for null/undefined.
 */
export function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date));
  } catch {
    return date;
  }
}
